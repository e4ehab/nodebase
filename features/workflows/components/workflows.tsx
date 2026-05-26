"use client";

import { EntityContainer, EntityHeader } from "@/components/entity-components";
import { useSuspenseWorkflows,useCreateWorkflow } from "../hooks/use-workflows"
import { useUpgradeModal } from "@/hooks/use-upgrade-modal";
import { useRouter } from "next/navigation";

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
    const {handleError, modal} = useUpgradeModal();
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
export const WorkflowsContainer = ({
    children
}: {
    children: React.ReactNode;
}) => {
    return (
        <EntityContainer
            header={<WorkflowsHeader />}
            search={<></>}
            pagination={<></>}
        >
            {children}
        </EntityContainer>
    );
};
//---------------------------------------------------------------------------------------------------------//
