import { PAGINATION } from "@/config/constants";
import prisma from "@/lib/db";
import { createTRPCRouter, premiumProcedure, protectedProcedure } from "@/trpc/init";
import { z } from "zod";
import { generateSlug } from "random-word-slugs"; // used to generate random workflow names like "blue-horse-jump" when creating a new workflow


export const workflowsRouter = createTRPCRouter({
    // create workflow
    create: premiumProcedure.mutation(({ ctx }) => {
        return prisma.workflow.create({
            data: {
                name: generateSlug(3),
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
        .input(
            z.object({
                page: z.number().default(PAGINATION.DEFAULT_PAGE),
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
});