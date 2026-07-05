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
        const latestMessage = messages.all
            .filter((message) => message.topic === topic)
            .map((message) => ({
                message,
                data: message.data as StatusMessageData,
            }))
            .filter(({ data }) => data.nodeId === nodeId)
            .sort((a, b) => {
                const aTime = a.message.createdAt?.getTime() ?? 0;
                const bTime = b.message.createdAt?.getTime() ?? 0;
                return bTime - aTime;
            })[0];

        if (latestMessage) {
            setStatus(latestMessage.data.status);
        }
    }, [messages.all, messages.delta, nodeId, topic]);

    return status;
}
