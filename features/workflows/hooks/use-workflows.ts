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
