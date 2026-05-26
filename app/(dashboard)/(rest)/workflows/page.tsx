import { requireAuth } from "@/lib/auth.utils";
import { prefetchWorkflows } from "@/features/workflows/server/prefetch";
import { HydrateClient } from "@/trpc/server";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";
import { WorkflowsList, WorkflowsContainer } from "@/features/workflows/components/workflows";

const Page = async () => {
    await requireAuth(); // this will throw an error if the user is not authenticated, which will be caught by the error boundary in layout.tsx and redirect the user to the login page
    prefetchWorkflows(); // prefetch workflows data for faster loading when the user navigates to the workflows page

    return (
        <WorkflowsContainer>
            <HydrateClient>
                <ErrorBoundary fallback={<p className="text-red-500">Error</p>}>
                    <Suspense fallback={<p>Loading...</p>}>
                        <WorkflowsList />
                    </Suspense>
                </ErrorBoundary>
            </HydrateClient>
        </WorkflowsContainer>

    );
}
export default Page;