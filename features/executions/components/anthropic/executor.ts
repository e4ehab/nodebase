import Handlebars from "handlebars";
import { NonRetriableError } from "inngest";
import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { NodeExecutor, PublishFn } from "@/features/executions/types";
import { anthropicChannel } from "@/inngest/channels/anthropic";
import type { NodeStatus } from "@/components/react-flow/node-status-indicator";
import prisma from "@/lib/db";
import { decrypt } from "@/lib/encryption";

Handlebars.registerHelper("json", (context) => {
    const jsonString = JSON.stringify(context, null, 2);
    return new Handlebars.SafeString(jsonString);
});

type AnthropicData = {
    variableName?: string;
    credentialId?: string;
    systemPrompt?: string;
    userPrompt?: string;
};

async function publishNodeStatus(
    publish: PublishFn,
    nodeId: string,
    status: NodeStatus,
) {
    await publish(anthropicChannel.status, { nodeId, status });
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

    return new NonRetriableError("Anthropic node failed");
}

export const anthropicExecutor: NodeExecutor<AnthropicData> = async ({
    data,
    nodeId,
    context,
    step,
    publish,
}) => {
    await publishNodeStatus(publish, nodeId, "loading");

    if (!data.variableName) {
        await publishNodeStatus(publish, nodeId, "error");
        throw new NonRetriableError("Anthropic node: Variable name is missing");
    }

    if (!data.credentialId) {
        await publishNodeStatus(publish, nodeId, "error");
        throw new NonRetriableError("Anthropic node: Credential is required");
    }

    if (!data.userPrompt) {
        await publishNodeStatus(publish, nodeId, "error");
        throw new NonRetriableError("Anthropic node: User prompt is missing");
    }

    const systemPrompt = data.systemPrompt
        ? Handlebars.compile(data.systemPrompt)(context)
        : "You are a helpful assistant.";
    const userPrompt = Handlebars.compile(data.userPrompt)(context);

    const credential = await step.run(`anthropic-credential-${nodeId}`, async () => {
        return prisma.credential.findUnique({
            where: { id: data.credentialId },
        });
    });

    if (!credential) {
        await publishNodeStatus(publish, nodeId, "error");
        throw new NonRetriableError("Anthropic node: Credential not found");
    }

    const anthropic = createAnthropic({
        apiKey: decrypt(credential.value),
    });

    try {
        const result = await step.run(`anthropic-${nodeId}`, async () => {
            const response = await generateText({
                model: anthropic("claude-sonnet-4-5"),
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
