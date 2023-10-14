import { IExpenseDto } from "@splitsies/shared-models";
import { ApiGatewayManagementApi } from "aws-sdk";

export async function sendMessage(endpoint: string, connectionId: string, body: IExpenseDto): Promise<void> {
    try {
        const apig = new ApiGatewayManagementApi({
            apiVersion: "2018-11-29",
            endpoint,
        });
        await apig
            .postToConnection({
                ConnectionId: connectionId,
                Data: JSON.stringify(body),
            })
            .promise();
    } catch (err) {
        // Ignore if connection no longer exists
        if (err.statusCode !== 400 && err.statusCode !== 410) {
            throw err;
        }
    }
}
