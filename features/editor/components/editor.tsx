"use client";

import { ErrorView, LoadingView } from "@/components/entity-components";
import { useSuspenseWorkflow } from "@/features/workflows/hooks/use-workflows";

export const EditorLoading = () => {
  return <LoadingView message="Loading editor..." />;
};

export const EditorError = () => {
  return <ErrorView message="Error loading editor" />;
};

// pass the workflowId to the Editor component, which will use it to fetch the workflow data using useSuspenseWorkflow hook 
export const Editor = ({ workflowId }: { workflowId: string }) => {
  const { data: workflow } = useSuspenseWorkflow(workflowId);

  return (
    <p>
      {JSON.stringify(workflow, null, 2)}
    </p>
  );
};