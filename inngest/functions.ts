import { inngest } from "./client";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

const openai = createOpenAI();
const google = createGoogleGenerativeAI();

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
        });
      }
    );

    return {
      answer: result.text,
    };
  }
);

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
        });
      }
    );


    return {
      answer: result.text,
    };
  }
);