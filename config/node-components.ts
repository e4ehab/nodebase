import { InitialNode } from "@/components/initial-node";
import { NodeType } from "@/app/generated/prisma/enums";
import type { NodeTypes } from "@xyflow/react";

export const nodeComponents = {
    [NodeType.INITIAL]: InitialNode, // when we use nodetype initial, render initial node
} as const satisfies NodeTypes;

export type RegisteredNodeType = keyof typeof nodeComponents;