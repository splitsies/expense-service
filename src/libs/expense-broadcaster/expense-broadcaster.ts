import { inject, injectable } from "inversify";
import { IExpenseBroadcaster } from "./expense-broadcaster-interface";
import { ExpenseMessage } from "@splitsies/shared-models";
import { IConnectionService } from "src/services/connection-service/connection-service-interface";
import { sendMessage } from "@libs/broadcast";
import { ILogger } from "@splitsies/utils";
import { IConnection } from "src/models/connection/connection-interface";
import { IConnectionConfiguration } from "src/models/configuration/connection/connection-configuration-interface";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { ICrossStageTopicProvider } from "src/providers/cross-stage-topic-provider/cross-stage-topic-provider.i";
import { CrossGatewayExpenseMessage } from "src/models/cross-gateway-expense-message";

@injectable()
export class ExpenseBroadcaster implements IExpenseBroadcaster {
    private readonly _snsClient = new SNSClient({ region: process.env.dbRegion });

    constructor(
        @inject(ILogger) private readonly _logger: ILogger,
        @inject(IConnectionService) private readonly _connectionService: IConnectionService,
        @inject(IConnectionConfiguration) private readonly _connectionConfiguration: IConnectionConfiguration,
        @inject(ICrossStageTopicProvider) private readonly _crossStageTopicProvider: ICrossStageTopicProvider,
    ) {}

    async broadcast(expense: ExpenseMessage, ignoredConnectionIds: string[] = []): Promise<void> {
        const ignored = new Set(ignoredConnectionIds);
        const connections = await this._connectionService.getConnectionsForExpenseId(expense.connectedExpenseId);
        const notifications = [];

        for (const connection of connections) {
            if (ignored.has(connection.connectionId)) continue;

            if (connection.gatewayUrl !== this._connectionConfiguration.gatewayUrl) {
                // If the connection does not belong to the current API Gateway, then the update message
                // needs to be routed to the correct API Gateway. This added complexity allows for distributed
                // API Gateway replicas cross-region while still maintaining real-time connection features
                const associatedTopic = this._crossStageTopicProvider.provide(connection.gatewayUrl);
                notifications.push(
                    this._snsClient.send(
                        new PublishCommand({
                            TopicArn: associatedTopic,
                            Message: JSON.stringify(new CrossGatewayExpenseMessage(expense, connection)),
                        }),
                    ),
                );
            } else {
                notifications.push(this.notify(expense, connection));
            }
        }

        await Promise.all(notifications);
    }

    async notify(expense: ExpenseMessage, connection: IConnection): Promise<void> {
        try {
            await sendMessage(connection.gatewayUrl, connection.connectionId, expense);
        } catch (e) {
            this._logger.error(`uncaught exception broadcasting for connection ${connection}`, e);
        }
    }
}
