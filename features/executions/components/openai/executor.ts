import Handlebars from "handlebars";
import { NonRetriableError } from "inngest";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import type { NodeExecutor, PublishFn } from "@/features/executions/types";
import { openAiChannel } from "@/inngest/channels/openai";
import type { NodeStatus } from "@/components/react-flow/node-status-indicator";

Handlebars.registerHelper("json", (context) => {
    const jsonString = JSON.stringify(context, null, 2);
    return new Handlebars.SafeString(jsonString);
});

type OpenAiData = {
    variableName?: string;
    systemPrompt?: string;
    userPrompt?: string;
};

async function publishNodeStatus(
    publish: PublishFn,
    nodeId: string,
    status: NodeStatus,
) {
    await publish(openAiChannel.status, { nodeId, status });
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

    return new NonRetriableError("OpenAI node failed");
}

export const openAiExecutor: NodeExecutor<OpenAiData> = async ({
    data,
    nodeId,
    context,
    step,
    publish,
}) => {
    await publishNodeStatus(publish, nodeId, "loading");

    if (!data.variableName) {
        await publishNodeStatus(publish, nodeId, "error");
        throw new NonRetriableError("OpenAI node: Variable name is missing");
    }

    if (!data.userPrompt) {
        await publishNodeStatus(publish, nodeId, "error");
        throw new NonRetriableError("OpenAI node: User prompt is missing");
    }

    if (!process.env.OPENAI_API_KEY) {
        await publishNodeStatus(publish, nodeId, "error");
        throw new NonRetriableError("OpenAI node: OPENAI_API_KEY is not configured");
    }

    const systemPrompt = data.systemPrompt
        ? Handlebars.compile(data.systemPrompt)(context)
        : "You are a helpful assistant.";
    const userPrompt = Handlebars.compile(data.userPrompt)(context);

    const openai = createOpenAI();

    try {
        const result = await step.run(`openai-${nodeId}`, async () => {
            const response = await generateText({
                model: openai("gpt-4"),
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
