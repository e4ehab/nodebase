/* Hook to fetch all workflows using suspense */
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import { useWorkflowsParams } from "./use-workflows-params";
//-------------------------------------------------------------------------------------------------------------------------------------//
export const useSuspenseWorkflows = () => {
  // "fetch all my workflows from the server, block until they're ready, and give me back fully typed data."
  const trpc = useTRPC();
  const [params] = useWorkflowsParams(); // get the current query params for workflows page (page, pageSize, search)

  return useSuspenseQuery(trpc.workflows.getMany.queryOptions(params));
}
//-------------------------------------------------------------------------------------------------------------------------------------//
/* Hook to create a new workflow */
export const useCreateWorkflow = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(trpc.workflows.create.mutationOptions({
    onSuccess: (data) => { // get the data of the created workflow
      toast.success(`workflow "${data.name}" created successfully`); // show success toast with the name of the created workflow
      queryClient.invalidateQueries(trpc.workflows.getMany.queryOptions({}),); // invalidate the getWorkflows query to refetch the list with the new workflow
    },
    onError: (error) => { // get the error object thrown
      toast.error(`Failed to create workflow: ${error.message}`); // show error toast with the error message
    },
  })
  );
};
//-------------------------------------------------------------------------------------------------------------------------------------//
/* Hook to remove a workflow */
export const useRemoveWorkflow = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.workflows.remove.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Workflow "${data.name}" removed`);
        queryClient.invalidateQueries(trpc.workflows.getMany.queryOptions({}));
        queryClient.invalidateQueries(
          trpc.workflows.getOne.queryFilter({ id: data.id }),
        );
      },
      onError: (error) => {
        toast.error(`Failed to remove workflow: ${error.message}`);
      },
    })
  )
}
//-------------------------------------------------------------------------------------------------------------------------------------//
/* Hook to fetch single workflow using suspence */
export const useSuspenseWorkflow = (id: string) => {
  const trpc = useTRPC();
  return useSuspenseQuery(trpc.workflows.getOne.queryOptions({ id }));
};
//-------------------------------------------------------------------------------------------------------------------------------------//
/* Hook to update a workflow name */
export const useUpdateWorkflowName = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.workflows.updateName.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Workflow "${data.name}" updated`);
        queryClient.invalidateQueries(
          trpc.workflows.getMany.queryOptions({}),
        );
        queryClient.invalidateQueries(
          trpc.workflows.getOne.queryOptions({ id: data.id }),
        );
      },
      onError: (error) => {
        toast.error(`Failed to update workflow: ${error.message}`);
      },
    }),
  );
};
//-------------------------------------------------------------------------------------------------------------------------------------//
/* Hook to update a workflow after clicking on (save) */
export const useUpdateWorkflow = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.workflows.update.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Workflow "${data.name}" saved`);
        queryClient.invalidateQueries(
          trpc.workflows.getMany.queryOptions({}),
        );
        queryClient.invalidateQueries(
          trpc.workflows.getOne.queryOptions({ id: data.id }),
        );
      },
      onError: (error) => {
        toast.error(`Failed to save workflow: ${error.message}`);
      },
    }),
  );
};