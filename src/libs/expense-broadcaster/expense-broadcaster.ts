import { inject, injectable } from "inversify";
import { IExpenseBroadcaster } from "./expense-broadcaster-interface";
import { ExpenseMessage } from "@splitsies/shared-models";
import { IConnectionService } from "src/services/connection-service/connection-service-interface";
import { sendMessage } from "@libs/broadcast";
import { ILogger } from "@splitsies/utils";
import { IConnection } from "src/models/connection/connection-interface";

@injectable()
export class ExpenseBroadcaster implements IExpenseBroadcaster {
    constructor(
        @inject(ILogger) private readonly _logger: ILogger,
        @inject(IConnectionService) private readonly _connectionService: IConnectionService,
    ) {}

    async broadcast(expense: ExpenseMessage, ignoredConnectionIds: string[] = []): Promise<void> {
        const connections = await this._connectionService.getConnectionsForExpenseId(expense.connectedExpenseId);

        const ignored = new Set(ignoredConnectionIds);

        // See local-emulation/queue-runner for setting up local listening to DynamoDB Stream
        await Promise.all(
            connections
                .filter((c) => !ignored.has(c.connectionId))
                .map((connection) => this.notify(expense, connection)),
        );
    }

    async notify(expense: ExpenseMessage, connection: IConnection): Promise<void> {
        try {
            await sendMessage(connection.gatewayUrl, connection.connectionId, expense);
        } catch (e) {
            this._logger.error(`uncaught exception broadcasting for connection ${connection}`, e);
        }
    }
}
