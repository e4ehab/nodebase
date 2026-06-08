import { InitialNode } from "@/components/initial-node";
import { NodeType } from "@/app/generated/prisma/enums";
import type { NodeTypes } from "@xyflow/react";

import { HttpRequestNode } from "@/features/executions/components/http-request/node";
import { ManualTriggerNode } from "@/features/triggers/components/manual-trigger/node";

export const nodeComponents = {
    [NodeType.INITIAL]: InitialNode, // when we use nodetype initial, render initial node
    [NodeType.HTTP_REQUEST]: HttpRequestNode,
    [NodeType.MANUAL_TRIGGER]: ManualTriggerNode,
} as const satisfies NodeTypes;

export type RegisteredNodeType = keyof typeof nodeComponents;