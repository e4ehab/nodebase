"use client";

// the follwing here is all the client components for the workflows page {header, search, pagination, container, loading view}

import { EmptyView, EntityContainer, EntityHeader, EntityItem, EntityList, EntityPagination, EntitySearch, ErrorView, LoadingView } from "@/components/entity-components";
import { useSuspenseWorkflows, useCreateWorkflow, useRemoveWorkflow } from "../hooks/use-workflows"
import { useUpgradeModal } from "@/hooks/use-upgrade-modal";
import { useRouter } from "next/navigation";
import { useWorkflowsParams } from "../hooks/use-workflows-params";
import { useEntitySearch } from "@/hooks/use-entity-search";
import { formatDistanceToNow } from "date-fns";
import { WorkflowIcon } from "lucide-react";
import type { Workflow } from "@/app/generated/prisma/client";
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
        <EntityList
            items={workflows.data.items}
            getKey={(workflow) => workflow.id}
            renderItem={(workflow) => <WorkflowItem data={workflow} />}
            emptyView={<WorkflowsEmpty />}
        />
    )
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
export const WorkflowsLoading = () => {
    return <LoadingView message="Loading workflows..." />;
};
//---------------------------------------------------------------------------------------------------------//
export const WorkflowsError = () => {
    return <ErrorView message="Failed to load workflows" />;
};
//---------------------------------------------------------------------------------------------------------//
export const WorkflowsEmpty = () => {
    const router = useRouter();
    const createWorkflow = useCreateWorkflow();
    const { handleError, modal } = useUpgradeModal();

    const handleCreate = () => {
        createWorkflow.mutate(undefined, {
            onError: (error) => {
                handleError(error);
            },
            onSuccess: (data) => {
                router.push(`/workflows/${data.id}`);
            }
        });
    };

    return (
        <>
            {modal}
            <EmptyView
                onNew={handleCreate} // pass the handleCreate function to the onNew prop to show the "New workflow" button in the empty state
                message="Workflow not found, create new workflow to get started"
            />
        </>
    );
};
//---------------------------------------------------------------------------------------------------------//
export const WorkflowItem = ({
    data,
}: {
    data: Workflow;
}) => {
    const removeWorkflow = useRemoveWorkflow();

    const handleRemove = () => {
        removeWorkflow.mutate({ id: data.id });
    }

    return (
        <EntityItem
            href={`/workflows/${data.id}`}
            title={data.name}
            subtitle={
                <>
                    Updated {formatDistanceToNow(data.updatedAt, { addSuffix: true })}{" "}
                    &bull; Created{" "}
                    {formatDistanceToNow(data.createdAt, { addSuffix: true })}
                </>
            }
            image={
                <div className="size-8 flex items-center justify-center">
                    <WorkflowIcon className="size-5 text-muted-foreground" />
                </div>
            }
            onRemove={handleRemove}
            isRemoving={removeWorkflow.isPending}
        />
    )
}
