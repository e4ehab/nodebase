"use client"

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

export const Client = () => {
    const {data: users} = useSuspenseQuery(useTRPC().getUsers.queryOptions());
    return (
        <div>
            {JSON.stringify(users)}
        </div>
    )
}