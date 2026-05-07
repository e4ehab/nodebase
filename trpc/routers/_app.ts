import { get } from 'http';
import { createTRPCRouter, protectedProcedure } from '../init';
import prisma from '@/lib/db';
import { inngest } from '@/inngest/client';

export const appRouter = createTRPCRouter({

  //getUsers = ONLY for logged-in users
  getUsers: protectedProcedure.query(({ ctx }) => {
    return prisma.user.findMany({
      where: {
        id: ctx.auth.user.id
      },
    });
  }),
  /*-----------------------------------------------------------------------------------------------*/
  //getWorkflows
  getWorkflows: protectedProcedure.query(({ }) => {
    return prisma.workflow.findMany();
  }),
  /*-----------------------------------------------------------------------------------------------*/
  //createWorkflow 
  createWorkflow: protectedProcedure.mutation(async () => {

    //fetch the video (testing inngest and background functions)
    await inngest.send({
      name: "app/task.created",
      data: { id: "task_001" },
    });

    return prisma.workflow.create({
      data: {
        name: "New Workflow"
      },
    });
  }),
  /*-----------------------------------------------------------------------------------------------*/
});

// export type definition of API
export type AppRouter = typeof appRouter;
