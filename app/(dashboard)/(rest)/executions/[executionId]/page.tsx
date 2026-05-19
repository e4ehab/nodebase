import { requireAuth } from "@/lib/auth.utils";

interface Props {
    params: Promise<{
        executionId: string // has to be the same name as the folder name in the file path [executionId] or it won't work
    }>
}

const Page = async ({ params }: Props) => {
    await requireAuth();
    const { executionId } = await params;

    return (
        <div>
            <h1>Execution id: {executionId}</h1>
        </div>
    )
}
export default Page;