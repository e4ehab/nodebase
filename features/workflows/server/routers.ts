import prisma from "@/lib/db";
import { createTRPCRouter, premiumProcedure, protectedProcedure } from "@/trpc/init";
import { z } from "zod";


export const workflowsRouter = createTRPCRouter({
    // create workflow
    create: premiumProcedure.mutation(({ ctx }) => {
        return prisma.workflow.create({
            data: {
                name: "New Workflow",
                userId: ctx.auth.user.id, // associate workflow with the authenticated user
            },
        });
    }),

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

    // get specific workflow by id
    getOne: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(({ ctx, input }) => {
            return prisma.workflow.findUnique({
                where: {
                    id: input.id, // INPUT: workflow id the client sent
                    userId: ctx.auth.user.id, // AUTH: the ID of the currently logged-in user, injected by tRPC's context ( only allow access to workflows that belong to the authenticated user )
                },
            });
        }),

    // get all workflows for the authenticated user
    getMany: protectedProcedure
        .query(({ ctx }) => {
            return prisma.workflow.findMany({
                where: { userId: ctx.auth.user.id },
                orderBy: { createdAt: "desc" }, // newest first
            });
        }),

});