import type { Realtime } from "inngest";
import { useAtomValue } from "jotai";
import { useRealtime } from "inngest/react";
import { useEffect, useRef, useState } from "react";
import type { NodeStatus } from "@/components/react-flow/node-status-indicator";
import { workflowExecutionRunAtom } from "@/features/editor/store/atoms";

interface UseNodeStatusOptions {
    nodeId: string;
    channel: Realtime.ChannelInput;
    topic: string;
    refreshToken: () => Promise<Realtime.Subscribe.ClientToken>;
    executionRunKey?: number;
}

type StatusMessageData = {
    nodeId: string;
    status: NodeStatus;
};

type NodeStatusEntry = {
    createdAt: number;
    status: NodeStatus;
};

function resolveNodeStatus(entries: NodeStatusEntry[]): NodeStatus {
    if (entries.length === 0) {
        return "initial";
    }

    const sorted = [...entries].sort((a, b) => b.createdAt - a.createdAt);
    const latest = sorted[0];
    const latestLoading = sorted.find((entry) => entry.status === "loading");
    const latestTerminal = sorted.find(
        (entry) => entry.status === "success" || entry.status === "error",
    );

    if (latestLoading && latestTerminal && latestTerminal.createdAt >= latestLoading.createdAt) {
        return latestTerminal.status;
    }

    return latest.status;
}

export function useNodeStatus({
    nodeId,
    channel,
    topic,
    refreshToken,
    executionRunKey,
}: UseNodeStatusOptions) {
    const [status, setStatus] = useState<NodeStatus>("initial");
    const resetAfterRef = useRef(0);

    const { messages } = useRealtime({
        channel,
        topics: [topic],
        token: refreshToken,
        enabled: true,
        historyLimit: 50,
    });

    useEffect(() => {
        if (executionRunKey === undefined) {
            return;
        }

        resetAfterRef.current = Date.now();
        setStatus("initial");
    }, [executionRunKey]);

    useEffect(() => {
        const entries: NodeStatusEntry[] = [];

        for (const message of messages.all) {
            if (!("data" in message) || !("createdAt" in message)) {
                continue;
            }

            if (message.topic !== topic) {
                continue;
            }

            const createdAt = message.createdAt.getTime();

            if (createdAt < resetAfterRef.current) {
                continue;
            }

            const data = message.data as StatusMessageData;

            if (data.nodeId !== nodeId) {
                continue;
            }

            entries.push({
                createdAt,
                status: data.status,
            });
        }

        setStatus(resolveNodeStatus(entries));
    }, [messages.all, messages.delta, nodeId, topic, executionRunKey]);

    return status;
}

export function useWorkflowNodeStatus(
    options: Omit<UseNodeStatusOptions, "executionRunKey">,
) {
    const executionRunKey = useAtomValue(workflowExecutionRunAtom);

    return useNodeStatus({
        ...options,
        executionRunKey,
    });
}
