import { PAGINATION } from "@/config/constants";
import prisma from "@/lib/db";
import { createTRPCRouter, premiumProcedure, protectedProcedure } from "@/trpc/init";
import { z } from "zod";
import { generateSlug } from "random-word-slugs"; // used to generate random workflow names like "blue-horse-jump" when creating a new workflow
import { NodeType } from "@/app/generated/prisma/client";
import type { Node, Edge } from "@xyflow/react"; // type of node & Edge from @xyflow/react
import { inngest } from "@/inngest/client";


export const workflowsRouter = createTRPCRouter({
    /*------------------------------------------------*/
    // create workflow
    create: premiumProcedure.mutation(({ ctx }) => {
        return prisma.workflow.create({
            data: {
                name: generateSlug(3),
                userId: ctx.auth.user.id, // associate workflow with the authenticated user
                nodes: { // every time a new workflow is created, we also create Initial node for this workflow
                    create: {
                        type: NodeType.INITIAL,
                        position: { x: 0, y: 0 },
                        name: NodeType.INITIAL, // default name for the initial node, can be changed later by the user in the editor
                    }

                }
            },
        });
    }),
    /*------------------------------------------------------------------------------------------------------------------------------------*/
    // remove workflow
    remove: protectedProcedure
        .input(z.object({ id: z.string() })) // This tells tRPC what shape of data to expect from the client (object with a string "id")
        .mutation(({ ctx, input }) => { // Mutation handler :receives a single object and we destructure two things from it: CTX, input

            return prisma.workflow.delete({
                where: {
                    id: input.id, // INPUT: workflow id the client sent
                    userId: ctx.auth.user.id, // AUTH: the ID of the currently logged-in user, injected by tRPC's context ( only allow deletion of workflows that belong to the authenticated user )
                },
            })

        }),
    /*------------------------------------------------------------------------------------------------------------------------------------*/
    // update workflow name
    updateName: protectedProcedure
        .input(z.object({ id: z.string(), name: z.string().min(1) }))
        .mutation(({ ctx, input }) => {
            return prisma.workflow.update({
                where: {
                    id: input.id, // INPUT: workflow id the client sent
                    userId: ctx.auth.user.id, // AUTH: the ID of the currently logged-in user, injected by tRPC's context ( only allow updates to workflows that belong to the authenticated user )
                },
                data: {
                    name: input.name, // new name for the workflow
                },
            });
        }),
    /*------------------------------------------------------------------------------------------------------------------------------------*/
    // update workflow after clicking on save
    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                nodes: z.array( // we will receve an array of nodes, inside of that array we expect objects with the following shape (id, type, position, data)
                    z.object({
                        id: z.string(),
                        type: z.string().nullish(),
                        position: z.object({ x: z.number(), y: z.number() }),
                        data: z.record(z.string(), z.any()).optional(),
                    }),
                ),
                edges: z.array(
                    z.object({
                        source: z.string(),
                        target: z.string(),
                        sourceHandle: z.string().nullish(),
                        targetHandle: z.string().nullish(),
                    }),
                ),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const { id, nodes, edges } = input;

            const workflow = await prisma.workflow.findUniqueOrThrow({
                where: { id, userId: ctx.auth.user.id },
            });

            // Transaction to ensure consistency
            return await prisma.$transaction(async (tx) => {
                // Delete existing nodes and connections (cascade deletes connections)
                await tx.node.deleteMany({
                    where: { workflowId: id },
                });

                // Create new nodes
                await tx.node.createMany({
                    data: nodes.map((node) => ({
                        id: node.id,
                        workflowId: id,
                        name: node.type || "unknown",
                        type: node.type as NodeType,
                        position: node.position,
                        data: node.data || {},
                    })),
                });

                // Create new connections
                await tx.connection.createMany({
                    data: edges.map((edge) => ({
                        workflowId: id,
                        fromNodeId: edge.source,
                        toNodeId: edge.target,
                        fromOutput: edge.sourceHandle || "main",
                        toInput: edge.targetHandle || "main",
                    })),
                });

                // Update workflow's updateAt timestamp (enhance UI)
                await tx.workflow.update({
                    where: { id },
                    data: { updatedAt: new Date() },
                });

                return workflow;
            });
        }),
    /*------------------------------------------------------------------------------------------------------------------------------------*/
    /*
     * Here's what it does step by step:
       ---------------------------------
     1. Receives a workflow id from the client.
     2. Fetches that workflow from the database, but only if it belongs to the currently logged-in user — so users can't access each other's workflows.
     3. Transforms the nodes into a format React Flow understands — mainly fixing the position field which is stored as raw JSON in the database but React Flow expects it as { x, y }.
     4. Transforms the connections (database term) into edges (React Flow term) — mapping fields like fromNodeId → source and toNodeId → target.
     5. Returns the workflow's id, name, the formatted nodes, and the formatted edges — ready to be rendered directly in the flow canvas.

     * In short: "Give me workflow X" → verify you own it → fetch it → translate it from database format to React Flow format → send it back."
     */
    getOne: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const workflow = await prisma.workflow.findUniqueOrThrow({
                where: {
                    id: input.id, // INPUT: workflow id the client sent
                    userId: ctx.auth.user.id, // AUTH: the ID of the currently logged-in user, injected by tRPC's context ( only allow access to workflows that belong to the authenticated user )
                },
                include: {
                    nodes: true, // include the nodes of the workflow in the response, so we can render them in the editor
                    connections: true, // include the connections of the workflow in the response, so we can render them in the editor
                },
            });

            // ransform the server nodes to react-flow compatible nodes ( mainly converting the position from Prisma's Json type to React Flow's expected format )
            const nodes: Node[] = workflow.nodes.map((node) => ({
                id: node.id,
                type: node.type,
                position: node.position as { x: number; y: number }, // cast the position to the expected format
                data: (node.data as Record<string, unknown>) || {}, // ensure data is an object, default to empty object if null
            }));

            // Transform server connections to react-flow compatible edges
            const edges: Edge[] = workflow.connections.map((connection) => ({
                id: connection.id,
                source: connection.fromNodeId,
                target: connection.toNodeId,
                sourceHandle: connection.fromOutput,
                targetHandle: connection.toInput,
            }));

            return {
                id: workflow.id,
                name: workflow.name,
                nodes,
                edges,
            };
        }),
    /*------------------------------------------------------------------------------------------------------------------------------------*/
    // get all workflows for the authenticated user
    getMany: protectedProcedure
        .input(
            z.object({
                page: z.number().min(1).default(PAGINATION.DEFAULT_PAGE),
                pageSize: z
                    .number()
                    .min(PAGINATION.MIN_PAGE_SIZE)
                    .max(PAGINATION.MAX_PAGE_SIZE)
                    .default(PAGINATION.DEFAULT_PAGE_SIZE),
                search: z.string().default(""),
            })
        )
        .query(async ({ ctx, input }) => {
            const { page, pageSize, search } = input;

            const [items, totalCount] = await Promise.all([
                prisma.workflow.findMany({
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                    where: {
                        userId: ctx.auth.user.id,
                        name: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                    orderBy: {
                        updatedAt: "desc",
                    },
                }),
                prisma.workflow.count({
                    where: {
                        userId: ctx.auth.user.id,
                        name: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                }),
            ]);



            const totalPages = Math.ceil(totalCount / pageSize);
            const hasNextPage = page < totalPages;
            const hasPreviousPage = page > 1;

            return {
                items,
                page,
                pageSize,
                totalCount,
                totalPages,
                hasNextPage,
                hasPreviousPage,
            };
        }),
    /*------------------------------------------------------------------------------------------------------------------------------------*/
    // execute workflow
    execute: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input, ctx }) => {
            const workflow = await prisma.workflow.findUniqueOrThrow({
                where: {
                    id: input.id,
                    userId: ctx.auth.user.id,
                },
            });

            await inngest.send({
                name: "workflows/execute.workflow",
                data: { workflowId: input.id },
            });

            return workflow;
        }),
});
