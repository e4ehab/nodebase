"use client";

import { EntityContainer, EntityHeader, EntityPagination, EntitySearch } from "@/components/entity-components";
import { useSuspenseWorkflows, useCreateWorkflow } from "../hooks/use-workflows"
import { useUpgradeModal } from "@/hooks/use-upgrade-modal";
import { useRouter } from "next/navigation";
import { useWorkflowsParams } from "../hooks/use-workflows-params";
import { useEntitySearch } from "@/hooks/use-entity-search";

//---------------------------------------------------------------------------------------------------------//
export const WorkflowsSearch = () => {
    const [params, setParams] = useWorkflowsParams();
    const { searchValue, onSearchChange } = useEntitySearch({
        params,
        setParams,
    });

    return (
        <EntitySearch
            value={searchValue}
            onChange={onSearchChange}
            placeholder="Search workflows"
        />
    );
};
//---------------------------------------------------------------------------------------------------------//
export const WorkflowsList = () => {
    const workflows = useSuspenseWorkflows();

    return (
        <div className="flex-1 flex justify-center items-center">
            <div className="text-center">
                {JSON.stringify(workflows.data, null, 2)}
            </div>
        </div>
    );
};

//---------------------------------------------------------------------------------------------------------//
export const WorkflowsHeader = ({ disabled }: { disabled?: boolean }) => {
    const router = useRouter();
    const createWorkflow = useCreateWorkflow();
    const { handleError, modal } = useUpgradeModal();
    const handleCreate = () => {
        createWorkflow.mutate(undefined, { // passing undefined as the first argument
            onSuccess: (data) => {
                router.push(`/workflows/${data.id}`); // navigate to the newly created workflow page
            },
            onError: (error) => {
                handleError(error); // this will open the upgrade modal if the error is a FORBIDDEN error, otherwise it will do nothing
            },
        });
    }
    return (
        <>
            {modal}
            <EntityHeader
                title="Workflows"
                description="Create and manage your workflows"
                onNew={handleCreate}
                newButtonLabel="New workflow"
                disabled={disabled}
                isCreating={createWorkflow.isPending}
            />
        </>
    );
};
//---------------------------------------------------------------------------------------------------------//
export const WorkflowsPagination = () => {
  const workflows = useSuspenseWorkflows();
  const [params, setParams] = useWorkflowsParams();

  return (
    <EntityPagination
      disabled={workflows.isFetching}
      totalPages={workflows.data.totalPages}
      page={workflows.data.page}
      onPageChange={(page) => setParams({ ...params, page })}
    />
  );
};
//---------------------------------------------------------------------------------------------------------//
export const WorkflowsContainer = ({
    children
}: {
    children: React.ReactNode;
}) => {
    return (
        <EntityContainer
            header={<WorkflowsHeader />}
            search={<WorkflowsSearch />}
            pagination={<WorkflowsPagination />}
        >
            {children}
        </EntityContainer>
    );
};
//---------------------------------------------------------------------------------------------------------//
