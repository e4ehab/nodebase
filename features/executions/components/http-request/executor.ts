import Handlebars from "handlebars";
import { NonRetriableError } from "inngest";
import ky, { HTTPError, type Options as KyOptions } from "ky";
import type { NodeExecutor, PublishFn } from "@/features/executions/types";
import { httpRequestChannel } from "@/inngest/channels/http-request";
import type { NodeStatus } from "@/components/react-flow/node-status-indicator";

Handlebars.registerHelper("json", (context) => {
    const jsonString = JSON.stringify(context, null, 2);
    const safeString = new Handlebars.SafeString(jsonString);

    return safeString;
});

type HttpRequestData = {
    variableName: string;
    endpoint: string;
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: string;
};

async function publishNodeStatus(
    publish: PublishFn,
    nodeId: string,
    status: NodeStatus,
) {
    await publish(httpRequestChannel.status, { nodeId, status });
}

function toNonRetriableError(error: unknown): NonRetriableError {
    if (error instanceof NonRetriableError) {
        return error;
    }

    if (error instanceof HTTPError) {
        return new NonRetriableError(
            `HTTP Request failed with status code ${error.response.status}: ${error.request.method} ${error.request.url}`,
        );
    }

    if (error instanceof Error) {
        return new NonRetriableError(error.message);
    }

    return new NonRetriableError("HTTP Request node failed");
}

export const httpRequestExecutor: NodeExecutor<HttpRequestData> = async ({
    data,
    nodeId,
    context,
    step,
    publish,
}) => {
    await publishNodeStatus(publish, nodeId, "loading");

    if (!data.endpoint) {
        await publishNodeStatus(publish, nodeId, "error");
        throw new NonRetriableError("HTTP Request node: No endpoint configured");
    }

    if (!data.variableName) {
        await publishNodeStatus(publish, nodeId, "error");
        throw new NonRetriableError("HTTP Request node: Variable name not configured");
    }

    if (!data.method) {
        await publishNodeStatus(publish, nodeId, "error");
        throw new NonRetriableError("HTTP Request node: method not configured");
    }

    const endpoint = Handlebars.compile(data.endpoint)(context);
    const method = data.method;
    let requestBody: string | undefined;

    if (["POST", "PUT", "PATCH"].includes(method)) {
        const resolved = Handlebars.compile(data.body || "{}")(context);

        try {
            JSON.parse(resolved);
        } catch {
            await publishNodeStatus(publish, nodeId, "error");
            throw new NonRetriableError(
                "HTTP Request node: Request body must be valid JSON",
            );
        }

        requestBody = resolved;
    }

    try {
        const result = await step.run(`http-request-${nodeId}`, async () => {
            const options: KyOptions = {
                method,
                throwHttpErrors: false,
            };

            if (requestBody !== undefined) {
                options.body = requestBody;
                options.headers = {
                    "Content-Type": "application/json",
                };
            }

            const response = await ky(endpoint, options);

            if (!response.ok) {
                throw new NonRetriableError(
                    `HTTP Request failed with status code ${response.status}: ${method} ${endpoint}`,
                );
            }

            const contentType = response.headers.get("content-type");
            const responseData = contentType?.includes("application/json")
                ? await response.json()
                : await response.text();

            const responsePayload = {
                httpResponse: {
                    status: response.status,
                    statusText: response.statusText,
                    data: responseData,
                },
            };

            return {
                ...context,
                [data.variableName]: responsePayload,
            };
        });

        await publishNodeStatus(publish, nodeId, "success");

        return result;
    } catch (error) {
        await publishNodeStatus(publish, nodeId, "error");
        throw toNonRetriableError(error);
    }
};
