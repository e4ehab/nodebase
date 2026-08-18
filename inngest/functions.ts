import { inngest } from "./client";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import prisma from "@/lib/db";
import { NodeType, ExecutionStatus } from "@/app/generated/prisma/enums";
import { getExecutor } from "@/features/executions/lib/executor-registry";
import { topologicalSort } from "./utils";
import { NonRetriableError } from "inngest";

const openai = createOpenAI();
const google = createGoogleGenerativeAI();
/*---------------------------------------------------------------------------------------------------------------------------------*/
// openai paid, google gemini free both used for inngest background functions
export const execute_with_openai = inngest.createFunction(
  //inngest@4.3.0 expects 2 arguments. id - triggers
  {
    id: "execute_with_openai/ai",
    triggers: [
      {
        event: "execute_with_openai/ai",
      },
    ],
  },
  async ({ step }) => {
    await step.sleep("pretend", "5s");


    // openai example min 5$
    const result = await step.run(
      "openai-generate-text",
      async () => {
        return await generateText({
          model: openai("gpt-4"),
          system: "You are a helpful assistant.",
          prompt: "What is 2 + 2?",

          experimental_telemetry: {
            isEnabled: true,
            recordInputs: true,
            recordOutputs: true,
          },
        });
      }
    );

    return {
      answer: result.text,
    };
  }
);
/*---------------------------------------------------------------------------------------------------------------------------------*/
export const execute_with_geminai = inngest.createFunction(
  //inngest@4.3.0 expects 2 arguments. id - triggers
  {
    id: "execute_with_geminai/ai",
    triggers: [
      {
        event: "execute_with_geminai/ai",
      },
    ],
  },
  async ({ step }) => {
    await step.sleep("pretend", "5s");


    // gemina example free
    const result = await step.run(
      "gemini-generate-text",
      async () => {
        return await generateText({
          model: google("gemini-2.5-flash"),
          system: "You are a helpful assistant.",
          prompt: "What is 2 + 2?",

          experimental_telemetry: {
            isEnabled: true,
            recordInputs: true,
            recordOutputs: true,
          },
        });
      }
    );

    return {
      answer: result.text,
    };
  }
);
/*---------------------------------------------------------------------------------------------------------------------------------*/
/* real job begins from here */
/*---------------------------*/
// execute workflow using the execution button inside editor.tsx
export const executeWorkflow = inngest.createFunction(
  {
    id: "execute_workflow",
    retries: process.env.NODE_ENV === "production" ? 3 : 0, // retry 3 times in production, no retry in development

    onFailure: async ({ event, step }) => { // if the workflow fails, update the execution status to FAILED and log the error
      return prisma.execution.update({
        where: { inngestEventId: event.data.event.id },
        data: {
          status: ExecutionStatus.FAILED,
          error: event.data.error.message,
          errorStack: event.data.error.stack,
        },
      });
    },

    triggers: [
      {
        event: "workflows/execute.workflow",
      },
    ],
  },
  async ({ event, step }) => {
    const inngestEventId = event.id;
    const workflowId = event.data.workflowId;

    if (!workflowId) { // inngest will not try if there is no workflow exists
      throw new NonRetriableError("Workflow ID is missing");
    }

    if (!inngestEventId) { // inngest will not try if there is no event ID 
      throw new NonRetriableError("Inngest Event ID is missing");
    }

    const publish = inngest.realtime.publish.bind(inngest.realtime);

    await step.run("create-execution", async () => {
      return prisma.execution.create({
        data: {
          workflowId,
          inngestEventId,
        },
      });
    });

    const sortedNodes = await step.run("prepare-workflow", async () => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: workflowId },
        include: {
          nodes: true,
          connections: true,
        },
      });

      return topologicalSort(workflow.nodes, workflow.connections);
    });

    // Initialize context with any initial data from the trigger
    let context = event.data.initialData || {};

    // Execute each node
    for (const node of sortedNodes) {
      const executor = getExecutor(node.type as NodeType);
      context = await executor({
        data: node.data as Record<string, unknown>,
        nodeId: node.id,
        context,
        step,
        publish,
      });
    }

    await step.run("update-execution", async () => {
      return prisma.execution.update({
        where: { inngestEventId, workflowId },
        data: {
          status: ExecutionStatus.SUCCESS,
          completedAt: new Date(),
          output: context,
        },
      })
    });

    return {
      workflowId,
      result: context,
    };
  },
);