import type { NodeExecutor, PublishFn } from "@/features/executions/types";
import { googleFormTriggerChannel } from "@/inngest/channels/google-form-trigger";
import type { NodeStatus } from "@/components/react-flow/node-status-indicator";
import { NonRetriableError } from "inngest";

type GoogleFormTriggerData = Record<string, unknown>;

async function publishNodeStatus(
    publish: PublishFn,
    nodeId: string,
    status: NodeStatus,
) {
    await publish(googleFormTriggerChannel.status, { nodeId, status });
}

export const googleFormTriggerExecutor: NodeExecutor<GoogleFormTriggerData> = async ({
    nodeId,
    context,
    step,
    publish,
}) => {
    await publishNodeStatus(publish, nodeId, "loading");

    try {
        const result = await step.run(`google-form-trigger-${nodeId}`, async () => context);

        await publishNodeStatus(publish, nodeId, "success");

        return result;
    } catch (error) {
        await publishNodeStatus(publish, nodeId, "error");
        throw error instanceof NonRetriableError
            ? error
            : new NonRetriableError("Google Form trigger node failed");
    }
};
