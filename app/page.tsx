import { requireAuth } from "@/lib/auth.utils";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { caller } from "@/trpc/server";


const Page = async () => {
  await requireAuth();

  const data = await caller.getUsers(); // we have used caller to pass data to the server component without using a hook

  return (
    <div>
      <p> Protected server component </p>
      <p>{JSON.stringify(data, null, 2)}</p>
      <LogoutButton />
    </div>
  )
}

export default Page;