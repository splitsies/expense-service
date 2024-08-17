import { inject, injectable } from "inversify";
import { IExpenseBroadcaster } from "./expense-broadcaster-interface";
import { IExpenseDto } from "@splitsies/shared-models";
import { IConnectionService } from "src/services/connection-service/connection-service-interface";
import { sendMessage } from "@libs/broadcast";
import { ILogger } from "@splitsies/utils";
import { IExpenseService } from "src/services/expense-service/expense-service-interface";
import { IConnection } from "src/models/connection/connection-interface";

@injectable()
export class ExpenseBroadcaster implements IExpenseBroadcaster {
    constructor(
        @inject(ILogger) private readonly _logger: ILogger,
        @inject(IConnectionService) private readonly _connectionService: IConnectionService,
        @inject(IExpenseService) private readonly _expenseService: IExpenseService,
    ) {}

    async broadcast(expense: IExpenseDto, ignoredConnectionIds: string[] = []): Promise<void> {
        const leadingExpenseId = await this._expenseService.getLeadingExpenseId(expense.id);
        const connections = await this._connectionService.getConnectionsForExpenseId(leadingExpenseId);

        if (expense.id !== leadingExpenseId) {
            expense = await this._expenseService.getExpense(leadingExpenseId);
        }

        const ignored = new Set(ignoredConnectionIds);

        // See local-emulation/queue-runner for setting up local listening to DynamoDB Stream
        return this._expenseService.queueExpenseUpdate(
            expense,
            connections.filter(c => !ignored.has(c.connectionId))
        );
    }

    async notify(expense: IExpenseDto, connection: IConnection): Promise<void> {
        try {
            await sendMessage(connection.gatewayUrl, connection.connectionId, expense);
        } catch (e) {
            this._logger.error(`uncaught exception broadcasting for connection ${connection}`, e);
        }
    }
}
