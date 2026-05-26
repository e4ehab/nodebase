import type { inferInput } from "@trpc/tanstack-react-query";
import { prefetch, trpc } from "@/trpc/server";

type input = inferInput<typeof trpc.workflows.getMany>;


export const prefetchWorkflows = (params?: input) => {
    prefetch(trpc.workflows.getMany.queryOptions(params)); 
    //params here is very important, as if we changed the input in getMany in features/workflows/server/routers.ts, no error would be thrown here
}