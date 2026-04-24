// import { caller } from "@/trpc/server"; // {caller} used to get data on server component
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary, queryOptions } from "@tanstack/react-query";
import { Client } from "./client";
import { Suspense } from "react";

const Page = async () => {
  //prefetching the data on the server
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.getUsers.queryOptions());

  return (
    <div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<p>Loading...</p>}> {/* handle the loading state */}
          <Client />
        </Suspense>
      </HydrationBoundary>
    </div>
  );
}

export default Page;