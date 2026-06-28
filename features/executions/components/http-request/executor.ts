import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import ky, { type Options as KyOptions } from "ky";
import Handlebars from "handlebars";

Handlebars.registerHelper("json", (context) => { // makes the qoute from &qout; to {} so the json result is correct
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

export const httpRequestExecutor: NodeExecutor<HttpRequestData> = async ({
    data,
    nodeId,
    context,
    step,
}) => {
    // TODO: Publish "loading" state for http request

    // the following if statements are run time validations ensuring the users are passing this 
    if (!data.endpoint) {
        // TODO: Publish "error" state for http request
        throw new NonRetriableError("HTTP Request node: No endpoint configured");
    }

    if (!data.variableName) {
        // TODO: Publish "error" state for http request
        throw new NonRetriableError("HTTP Request node: Variable name not configured");
    }

    if (!data.method) {
        // TODO: Publish "error" state for http request
        throw new NonRetriableError("HTTP Request node: method not configured");
    }

    const result = await step.run("http-request", async () => {
        // http://..../{{todo.httpResponse.data.userId}}
        const endpoint = Handlebars.compile(data.endpoint)(context);
        //  handlebars make the http request chainable (data endpoint + context)
        //  data.endpoint -> is the template the user configured on the node
        //  contex -> is the data from previous node
        //  compined they produce the final reql url: template + context filled in the acutual url (https://api.example.com/users/456)
        const method = data.method;

        const options: KyOptions = { method };


        if (["POST", "PUT", "PATCH"].includes(method)) {
            const resolved = Handlebars.compile(data.body || "{}")(context);
            JSON.parse(resolved);
            options.body = resolved;
            options.headers = {
                "Content-Type": "application/json", // ensure {POST, Put, Patch} requests doesn't get rejected, because headers are important part of http request
            }
        };

        const response = await ky(endpoint, options);
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
        }

    });

    // TODO: Publish "success" state for http request

    return result;
};