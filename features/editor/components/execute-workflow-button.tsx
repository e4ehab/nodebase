// modified this file to save the workflow before execution "same function as the one exists in the save button"
import { Button } from "@/components/ui/button";
import { useExecuteWorkflow, useUpdateWorkflow } from "@/features/workflows/hooks/use-workflows";
import { editorAtom } from "@/features/editor/store/atoms";
import { useAtomValue } from "jotai";
import { FlaskConicalIcon } from "lucide-react";

export const ExecuteWorkflowButton = ({ workflowId }: { workflowId: string }) => {
  const editor = useAtomValue(editorAtom);
  const saveWorkflow = useUpdateWorkflow();
  const executeWorkflow = useExecuteWorkflow();

  const handleExecute = () => {
    if (!editor) { return; }

    const nodes = editor.getNodes();
    const edges = editor.getEdges();

    saveWorkflow.mutate({ id: workflowId, nodes, edges }, {
      onSuccess: () => {
        executeWorkflow.mutate({ id: workflowId });
      },
    });
  };

  const isPending = saveWorkflow.isPending || executeWorkflow.isPending;

  return (
    <Button size="lg" onClick={handleExecute} disabled={isPending}>
      <FlaskConicalIcon className="size-4" />
      Execute workflow
    </Button>
  );
};
