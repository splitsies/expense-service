import { inject, injectable } from "inversify";
import { IExpenseBroadcaster } from "./expense-broadcaster-interface";
import { ExpenseMessage } from "@splitsies/shared-models";
import { IConnectionService } from "src/services/connection-service/connection-service-interface";
import { sendMessage } from "@libs/broadcast";
import { ILogger } from "@splitsies/utils";
import { IConnection } from "src/models/connection/connection-interface";
import { IConnectionConfiguration } from "src/models/configuration/connection/connection-configuration-interface";
import { IExpenseService } from "src/services/expense-service/expense-service-interface";

@injectable()
export class ExpenseBroadcaster implements IExpenseBroadcaster {
    constructor(
        @inject(ILogger) private readonly _logger: ILogger,
        @inject(IConnectionService) private readonly _connectionService: IConnectionService,
        @inject(IConnectionConfiguration) private readonly _connectionConfiguration: IConnectionConfiguration,
        @inject(IExpenseService) private readonly _expenseService: IExpenseService
    ) {}

    async broadcast(expense: ExpenseMessage, ignoredConnectionIds: string[] = []): Promise<void> {
        const ignored = new Set(ignoredConnectionIds);
        const connections = (await this._connectionService.getConnectionsForExpenseId(expense.connectedExpenseId))
            .filter(c => !ignored.has(c.connectionId));
        
        const externalStageConnections: IConnection[] = [];
        const matchingStageConnections: IConnection[] = [];

        for (const connection of connections) {
            if (connection.gatewayUrl !== this._connectionConfiguration.gatewayUrl) {
                externalStageConnections.push(connection);
            } else {
                matchingStageConnections.push(connection);
            }
        }

        // See local-emulation/queue-runner for setting up local listening to DynamoDB Stream
        await Promise.all([
            this._expenseService.queueExpenseUpdate(expense, externalStageConnections),
            ...matchingStageConnections.map((connection) => this.notify(expense, connection)),
        ]);
    }

    async notify(expense: ExpenseMessage, connection: IConnection): Promise<void> {
        try {
            console.log(`notifying ${connection.connectionId} on ${connection.gatewayUrl}`);
            await sendMessage(connection.gatewayUrl, connection.connectionId, expense);
            console.log(`${connection.connectionId} notified successfully`);
        } catch (e) {
            this._logger.error(`uncaught exception broadcasting for connection ${connection}`, e);
        }
    }
}
