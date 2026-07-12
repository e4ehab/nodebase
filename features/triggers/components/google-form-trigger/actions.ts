"use server";

import { getClientSubscriptionToken } from "inngest/react";
import { googleFormTriggerChannel } from "@/inngest/channels/google-form-trigger";
import { inngest } from "@/inngest/client";

export async function fetchGoogleFormTriggerRealtimeToken() {
    return getClientSubscriptionToken(inngest, {
        channel: googleFormTriggerChannel,
        topics: ["status"],
    });
}
