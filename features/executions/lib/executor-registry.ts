import { NodeType } from "@/app/generated/prisma/enums";
import { NodeExecutor } from "../types";
import { manualTriggerExecutor } from "@/features/triggers/components/manual-trigger/executor";
import { httpRequestExecutor } from "../components/http-request/executor";

export const executorRegistry: Record<NodeType, NodeExecutor> = { // executorRegistry type of Record accepts two arguments (NodeType, NodeExecutor)
    [NodeType.INITIAL]: manualTriggerExecutor, // the executor of initial node
    [NodeType.MANUAL_TRIGGER]: manualTriggerExecutor, // the executor of manual trigger node
    [NodeType.HTTP_REQUEST]: httpRequestExecutor, // the executor of http request node
};

// get through all of our nodes and depending on it's type we execute it 
export const getExecutor = (type: NodeType): NodeExecutor => {
    const executor = executorRegistry[type];
    if (!executor) {
        throw new Error(`No executor found for node type: ${type}`);
    }
    return executor;
};