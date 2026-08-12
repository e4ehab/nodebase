import Handlebars from "handlebars";
import { decode } from "html-entities";
import { NonRetriableError } from "inngest";
import ky from "ky";
import type { NodeExecutor, PublishFn } from "@/features/executions/types";
import { discordChannel } from "@/inngest/channels/discord";
import type { NodeStatus } from "@/components/react-flow/node-status-indicator";

Handlebars.registerHelper("json", (context) => {
    const jsonString = JSON.stringify(context, null, 2);
    return new Handlebars.SafeString(jsonString);
});

type DiscordData = {
    variableName?: string;
    webhookUrl?: string;
    content?: string;
    username?: string;
};

async function publishNodeStatus(
    publish: PublishFn,
    nodeId: string,
    status: NodeStatus,
) {
    await publish(discordChannel.status, { nodeId, status });
}

function toNonRetriableError(error: unknown): NonRetriableError {
    if (error instanceof NonRetriableError) {
        return error;
    }

    if (error instanceof Error) {
        return new NonRetriableError(error.message);
    }

    return new NonRetriableError("Discord node failed");
}

export const discordExecutor: NodeExecutor<DiscordData> = async ({
    data,
    nodeId,
    context,
    step,
    publish,
}) => {
    await publishNodeStatus(publish, nodeId, "loading");

    if (!data.content) {
        await publishNodeStatus(publish, nodeId, "error");
        throw new NonRetriableError("Discord node: Message content is required");
    }

    if (!data.webhookUrl) {
        await publishNodeStatus(publish, nodeId, "error");
        throw new NonRetriableError("Discord node: Webhook URL is required");
    }

    if (!data.variableName) {
        await publishNodeStatus(publish, nodeId, "error");
        throw new NonRetriableError("Discord node: Variable name is missing");
    }

    const rawContent = Handlebars.compile(data.content)(context);
    const content = decode(rawContent);
    const username = data.username
        ? decode(Handlebars.compile(data.username)(context))
        : undefined;

    try {
        const result = await step.run(`discord-${nodeId}`, async () => {
            await ky.post(data.webhookUrl!, {
                json: {
                    content: content.slice(0, 2000),
                    username,
                },
            });

            return {
                ...context,
                [data.variableName!]: {
                    messageContent: content.slice(0, 2000),
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
