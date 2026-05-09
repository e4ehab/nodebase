
"use client";
// use it as client component to test data fetching

import { LogoutButton } from "@/features/auth/components/logout-button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC, } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";


const Page = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data } = useQuery(trpc.getWorkflows.queryOptions()); // we are using useQuery to fetch data from the server and display it in the client component

  const create = useMutation(trpc.createWorkflow.mutationOptions({
    onSuccess: () => {
      toast.success("Workflow queued"); // show a success toast message when the workflow is created successfully
      queryClient.invalidateQueries(trpc.getWorkflows.queryOptions()); // Mark the getWorkflows data as outdated and refetch it ,so after creating new work flow ask the server for fresh data again to show the new work flow.
    }
  })
  ); // we are using useMutation to create a new workflow and then refetch the data to see the new workflow in the list

  const testAi = useMutation(trpc.testAi.mutationOptions()); //without using inngest

  const testOpenaiAi = useMutation(trpc.testOpenaiAi.mutationOptions({
    onSuccess: () => {
      toast.success("AI Job queued");
    }
  })); //with inngest

  const testGeminiAi = useMutation(trpc.testGeminaiAi.mutationOptions({
    onSuccess: () => {
      toast.success("Gemini AI Job queued");
    }
  }));

  return (
    <div>
      <p> Protected server component </p>
      <p>{JSON.stringify(data, null, 2)}</p>
      <Button disabled={create.isPending} onClick={() => create.mutate()}>
        Create Workflow
      </Button>
      <Button disabled={testAi.isPending} onClick={() => testAi.mutate()}>
        Test AI without inngest
      </Button>
      <Button disabled={testOpenaiAi.isPending} onClick={() => testOpenaiAi.mutate()}>
        Test openai with inngest
      </Button>
      <Button disabled={testGeminiAi.isPending} onClick={() => testGeminiAi.mutate()}>
        Test Gemini AI with inngest
      </Button>
      <LogoutButton />
    </div>
  )
}

export default Page;

/*
// server component version
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
*/
