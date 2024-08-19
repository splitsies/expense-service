import { ExpenseMessage } from "@splitsies/shared-models";
import { ApiGatewayManagementApi } from "@aws-sdk/client-apigatewaymanagementapi";

export async function sendMessage(endpoint: string, connectionId: string, body: ExpenseMessage): Promise<void> {
    try {
        const apig = new ApiGatewayManagementApi({
            apiVersion: "2018-11-29",
            endpoint,
        });
        await apig.postToConnection({
            ConnectionId: connectionId,
            Data: JSON.stringify(body),
        });
    } catch (err) {
        // Ignore if connection no longer exists
        if (
            err.statusCode === 400 ||
            err.statusCode === 410 ||
            err.httpStatusCode === 400 ||
            err.httpStatusCode === 410
        ) {
            throw err;
        }
    }
}

export async function deleteConnection(endpoint: string, connectionId: string): Promise<void> {
    try {
        const apig = new ApiGatewayManagementApi({
            apiVersion: "2018-11-29",
            endpoint,
        });
        await apig.deleteConnection({
            ConnectionId: connectionId,
        });
    } catch (err) {
        // Ignore if connection no longer exists
        if (
            err.statusCode === 400 ||
            err.statusCode === 410 ||
            err.httpStatusCode === 400 ||
            err.httpStatusCode === 410
        ) {
            throw err;
        }
    }
}
