import { inject, injectable } from "inversify";
import { IExpenseBroadcaster } from "./expense-broadcaster-interface";
import { ExpenseMessage, IExpenseDto, IExpenseMessage } from "@splitsies/shared-models";
import { IConnectionConfiguration } from "src/models/configuration/connection/connection-configuration-interface";
import { IConnectionService } from "src/services/connection-service/connection-service-interface";
import { sendMessage } from "@libs/broadcast";
import { ILogger } from "@splitsies/utils";
import { IExpenseService } from "src/services/expense-service/expense-service-interface";
import { ExpenseUpdate } from "src/models/expense-update/expense-update";

@injectable()
export class ExpenseBroadcaster implements IExpenseBroadcaster {
    constructor(
        @inject(ILogger) private readonly _logger: ILogger,
        @inject(IConnectionConfiguration) private readonly _connectionConfiguration: IConnectionConfiguration,
        @inject(IConnectionService) private readonly _connectionService: IConnectionService,
        @inject(IExpenseService) private readonly _expenseService: IExpenseService,
    ) {}

    async broadcast(expenseId: string, message: IExpenseMessage): Promise<void> {

        // TODO: do stream triggers work locally? just broadcast this instead if running local if it doesn't
        const expense = await this._expenseService.getExpense(expenseId);
        return this._expenseService.queueExpenseUpdate(new ExpenseUpdate(expense));




        const connectionIds = await this._connectionService.getConnectionsForExpenseId(expenseId);

        const promises: Promise<void>[] = [];
        for (const id of connectionIds) {
            try {
                promises.push(sendMessage(this._connectionConfiguration.gatewayUrl, id, message));
            } catch (e) {
                this._logger.error(`uncaught exception broadcasting for connection ${id}`, e);
            }
        }

        await Promise.all(promises);
    }

    async notify(expense: IExpenseDto): Promise<void> {
        const connectionIds = await this._connectionService.getConnectionsForExpenseId(expense.id);

        const promises: Promise<void>[] = [];
        for (const id of connectionIds) {
            try {
                promises.push(sendMessage(this._connectionConfiguration.gatewayUrl, id, new ExpenseMessage("expense", expense)));
            } catch (e) {
                this._logger.error(`uncaught exception broadcasting for connection ${id}`, e);
            }
        }

        await Promise.all(promises);
    }
}
