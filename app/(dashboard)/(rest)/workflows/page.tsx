import { requireAuth } from "@/lib/auth.utils";
import { prefetchWorkflows } from "@/features/workflows/server/prefetch";
import { HydrateClient } from "@/trpc/server";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";
import { WorkflowsList, WorkflowsContainer } from "@/features/workflows/components/workflows";
import { workflowsParamsLoader } from "@/features/workflows/server/params-loader";
import type { SearchParams } from "nuqs/server";

type Props = {
    searchParams: Promise<SearchParams>;
}

const Page = async ({ searchParams }: Props) => {
    const params = await workflowsParamsLoader(searchParams); // load the params from the URL and parse them into typed data using the loader we created in features/workflows/server/params-loader.ts  
    await requireAuth(); // this will throw an error if the user is not authenticated, which will be caught by the error boundary in layout.tsx and redirect the user to the login page
    prefetchWorkflows(params); // prefetch workflows data for faster loading when the user navigates to the workflows page

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