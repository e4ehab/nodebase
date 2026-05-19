import { requireAuth } from "@/lib/auth.utils";

interface Props {
    params: Promise<{
        workflowsId: string // has to be the same name as the folder name in the file path [workflowsId] or it won't work
    }>
}

const Page = async ({ params }: Props) => {
    await requireAuth();
    const { workflowsId } = await params;

    return (
        <div>
            <h1>Workflow id: {workflowsId}</h1>
        </div>
    )
}
export default Page;