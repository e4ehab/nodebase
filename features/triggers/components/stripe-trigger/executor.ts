import type { NodeExecutor, PublishFn } from "@/features/executions/types";
import { stripeTriggerChannel } from "@/inngest/channels/stripe-trigger";
import type { NodeStatus } from "@/components/react-flow/node-status-indicator";
import { NonRetriableError } from "inngest";

type StripeTriggerData = Record<string, unknown>;

async function publishNodeStatus(
    publish: PublishFn,
    nodeId: string,
    status: NodeStatus,
) {
    await publish(stripeTriggerChannel.status, { nodeId, status });
}

export const stripeTriggerExecutor: NodeExecutor<StripeTriggerData> = async ({
    nodeId,
    context,
    step,
    publish,
}) => {
    await publishNodeStatus(publish, nodeId, "loading");

    try {
        const result = await step.run(`stripe-trigger-${nodeId}`, async () => context);

        await publishNodeStatus(publish, nodeId, "success");

        return result;
    } catch (error) {
        await publishNodeStatus(publish, nodeId, "error");
        throw error instanceof NonRetriableError
            ? error
            : new NonRetriableError("Stripe trigger node failed");
    }
};
