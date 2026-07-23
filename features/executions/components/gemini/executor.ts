import Handlebars from "handlebars";
import { NonRetriableError } from "inngest";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { NodeExecutor, PublishFn } from "@/features/executions/types";
import { geminiChannel } from "@/inngest/channels/gemini";
import type { NodeStatus } from "@/components/react-flow/node-status-indicator";

Handlebars.registerHelper("json", (context) => {
    const jsonString = JSON.stringify(context, null, 2);
    return new Handlebars.SafeString(jsonString);
});

type GeminiData = {
    variableName?: string;
    systemPrompt?: string;
    userPrompt?: string;
};

async function publishNodeStatus(
    publish: PublishFn,
    nodeId: string,
    status: NodeStatus,
) {
    await publish(geminiChannel.status, { nodeId, status });
}

function toNonRetriableError(error: unknown): NonRetriableError {
    if (error instanceof NonRetriableError) {
        return error;
    }

    if (error instanceof Error) {
        return new NonRetriableError(error.message);
    }

    if (typeof error === "object" && error !== null && "message" in error) {
        return new NonRetriableError(String((error as { message: unknown }).message));
    }

    return new NonRetriableError("Gemini node failed");
}

export const geminiExecutor: NodeExecutor<GeminiData> = async ({
    data,
    nodeId,
    context,
    step,
    publish,
}) => {
    await publishNodeStatus(publish, nodeId, "loading");

    if (!data.variableName) {
        await publishNodeStatus(publish, nodeId, "error");
        throw new NonRetriableError("Gemini node: Variable name is missing");
    }

    if (!data.userPrompt) {
        await publishNodeStatus(publish, nodeId, "error");
        throw new NonRetriableError("Gemini node: User prompt is missing");
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        await publishNodeStatus(publish, nodeId, "error");
        throw new NonRetriableError(
            "Gemini node: GOOGLE_GENERATIVE_AI_API_KEY is not configured",
        );
    }

    const systemPrompt = data.systemPrompt
        ? Handlebars.compile(data.systemPrompt)(context)
        : "You are a helpful assistant.";
    const userPrompt = Handlebars.compile(data.userPrompt)(context);

    const google = createGoogleGenerativeAI();

    try {
        const result = await step.run(`gemini-${nodeId}`, async () => {
            const response = await generateText({
                model: google("gemini-2.5-flash"),
                system: systemPrompt,
                prompt: userPrompt,
            });

            return {
                ...context,
                [data.variableName!]: {
                    text: response.text,
                },
            };
        });

        await publishNodeStatus(publish, nodeId, "success");

        return result;
    } catch (error) {
        await publishNodeStatus(publish, nodeId, "error");
        throw toNonRetriableError(error);
    }
};
