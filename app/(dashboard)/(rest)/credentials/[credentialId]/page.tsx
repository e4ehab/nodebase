import { requireAuth } from "@/lib/auth.utils";

interface Props {
    params: Promise<{
        credentialId: string // has to be the same name as the folder name in the file path [credentialId] or it won't work
    }>
}

const Page = async ({ params }: Props) => {
    await requireAuth();
    const { credentialId } = await params;

    return (
        <div>
            <h1>Credential id: {credentialId}</h1>
        </div>
    )
}
export default Page;