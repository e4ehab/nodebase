import { baseProcedure, createTRPCRouter, premiumProcedure, protectedProcedure } from '../init';
import prisma from '@/lib/db';
import { inngest } from '@/inngest/client';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { TRPCError } from '@trpc/server';


export const appRouter = createTRPCRouter({
  /*-----------------------------------------------------------------------------------------------*/
  //send dummy error
  testError: baseProcedure.mutation(async () => {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "This is a test error from the server",
    });
  }),
  /*-----------------------------------------------------------------------------------------------*/
  //test geminai(new)
  testGeminaiAi: baseProcedure.mutation(async () => {
    await inngest.send({
      name: "execute_with_geminai/ai",
    });

    return { success: true, message: "Job queued" }
  }),
  /*-----------------------------------------------------------------------------------------------*/

  /*-----------------------------------------------------------------------------------------------*/
  //test openai with inngest (new)
  testOpenaiAi: baseProcedure.mutation(async () => {
    await inngest.send({
      name: "execute_with_openai/ai",
    });

    return { success: true, message: "Job queued" }
  }),
  /*-----------------------------------------------------------------------------------------------*/
  //test openai (old)
  testAi: protectedProcedure.mutation(async () => {
    const { text } = await generateText({
      model: openai('gpt-5'),
      prompt: 'Write a vegetarian lasagna recipe for 4 people.',
    });
    return text;
  }),
  /*-----------------------------------------------------------------------------------------------*/
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
  //test geminai with PremuimProcedure
  testGeminaiAiWithPremuimProcedure: premiumProcedure.mutation(async () => {
    await inngest.send({
      name: "execute_with_geminai/ai",
    });

    return { success: true, message: "Job queued" }
  }),
  /*-----------------------------------------------------------------------------------------------*/
});

// export type definition of API
export type AppRouter = typeof appRouter;