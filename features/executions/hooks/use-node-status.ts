import type { Realtime } from "inngest";
import { useRealtime } from "inngest/react";
import { useEffect, useState } from "react";
import type { NodeStatus } from "@/components/react-flow/node-status-indicator";

interface UseNodeStatusOptions {
    nodeId: string;
    channel: Realtime.ChannelInput;
    topic: string;
    refreshToken: () => Promise<Realtime.Subscribe.ClientToken>;
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
}: UseNodeStatusOptions) {
    const [status, setStatus] = useState<NodeStatus>("initial");

    const { messages } = useRealtime({
        channel,
        topics: [topic],
        token: refreshToken,
        enabled: true,
        historyLimit: 50,
    });

    useEffect(() => {
        const entries: NodeStatusEntry[] = [];

        for (const message of messages.all) {
            if (!("data" in message) || !("createdAt" in message)) {
                continue;
            }

            if (message.topic !== topic) {
                continue;
            }

            const data = message.data as StatusMessageData;

            if (data.nodeId !== nodeId) {
                continue;
            }

            entries.push({
                createdAt: message.createdAt.getTime(),
                status: data.status,
            });
        }

        setStatus(resolveNodeStatus(entries));
    }, [messages.all, messages.delta, nodeId, topic]);

    return status;
}
