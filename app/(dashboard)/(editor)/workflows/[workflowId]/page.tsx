import { Editor, EditorError, EditorLoading } from "@/features/editor/components/editor";
import { EditorHeader } from "@/features/editor/components/editor-header";
import { prefetchWorkflow } from "@/features/workflows/server/prefetch";
import { requireAuth } from "@/lib/auth.utils";
import { HydrateClient } from "@/trpc/server";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface Props {
    params: Promise<{
        workflowId: string // has to be the same name as the folder name in the file path [workflowsId] or it won't work
    }>
}

const Page = async ({ params }: Props) => {
    await requireAuth();

    const { workflowId } = await params;

    prefetchWorkflow(workflowId); // prefetch the workflow data using the id from the url params, so that when we useSuspenseWorkflow in the child component, it will be already prefetched and will not show the loading state

    return (
        <HydrateClient>
            <ErrorBoundary fallback={<EditorError />}>
                <Suspense fallback={<EditorLoading />}>
                    <div className="flex flex-col h-screen">
                        <EditorHeader workflowId={workflowId} /> {/* pass the workflowId to the EditorHeader component, which will use it to fetch the workflow data using useSuspenseWorkflow hook */}
                        <main className="flex-1">
                            <Editor workflowId={workflowId} />{/* pass the workflowId to the Editor component, which will use it to fetch the workflow data using useSuspenseWorkflow hook */}
                        </main>
                    </div>
                </Suspense>
            </ErrorBoundary>
        </HydrateClient >
    )
}

export default Page;