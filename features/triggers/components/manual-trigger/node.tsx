import { NodeProps } from "@xyflow/react";
import { memo, useState } from "react";
import { BaseTriggerNode } from "../base-trigger-node";
import { MousePointerIcon } from "lucide-react";
import { ManualTriggerDialog } from "./dialog";

export const ManualTriggerNode = memo((props: NodeProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const handleOpenSettings = () => { setDialogOpen(true); }
  const nodeStatus = "initial"; // pass the current status of the node (initial, loading, success, error) to the ManualTriggerNode and then to the BaseTriggerNode to show the appropriate status indicator

  return (
    <>
      <ManualTriggerDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <BaseTriggerNode
        {...props}
        icon={MousePointerIcon}
        name="When clicking 'Execute workflow'"
        status={nodeStatus} // pass the current status of the node (initial, loading, success, error) to the ManualTriggerNode and then to the BaseTriggerNode to show the appropriate status indicator
        onSettings={handleOpenSettings}
        onDoubleClick={handleOpenSettings}
      />
    </>
  )
});