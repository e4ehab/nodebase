// src/app/api/inngest/route.ts
import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { execute_with_openai,execute_with_geminai, executeWorkflow } from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        execute_with_openai,
        execute_with_geminai,
        executeWorkflow
    ], // register the functions comming from inngest/functions.ts
}); 
