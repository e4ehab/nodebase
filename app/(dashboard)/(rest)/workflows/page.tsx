import { requireAuth } from "@/lib/auth.utils";

const Page = async() => {
    await requireAuth(); // this will throw an error if the user is not authenticated, which will be caught by the error boundary in layout.tsx and redirect the user to the login page
    return (
        <div>
            <h1>Workflows</h1>
        </div>
    )   
}
export default Page;