"use server";

import { getClientSubscriptionToken } from "inngest/react";
import { slackChannel } from "@/inngest/channels/slack";
import { inngest } from "@/inngest/client";

export async function fetchSlackRealtimeToken() {
    return getClientSubscriptionToken(inngest, {
        channel: slackChannel,
        topics: ["status"],
    });
}
