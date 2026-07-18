import { sendWorkflowExecution } from "@/inngest/utils";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const workflowId = url.searchParams.get("workflowId");

        if (!workflowId) {
            return NextResponse.json(
                { success: false, error: "Missing required query parameter: workflowId" },
                { status: 400 },
            );
        }

        const body = await request.json();
        const object = body.data?.object as Record<string, unknown> | undefined;

        const stripeData = {
            eventId: body.id, // e.g., "evt_1J2Y3Z4A5B6C7D8E9F0G"
            eventType: body.type, // e.g., "payment_intent.succeeded"
            timestamp: body.created,
            livemode: body.livemode, // true if the event was generated from a live mode webhook, false if from a test mode webhook
            amount: object?.amount, // amount in cents, e.g., 1000 for $10.00
            currency: object?.currency, // amount currency, e.g., "usd"
            customerId: object?.customer,
            raw: object, // means the entire object from Stripe is included in the payload
        };

        await sendWorkflowExecution({
            workflowId,
            initialData: {
                stripe: stripeData,
            },
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Stripe webhook error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to process Stripe event" },
            { status: 500 },
        );
    }
}
