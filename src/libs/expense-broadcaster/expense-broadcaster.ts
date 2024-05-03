import { inject, injectable } from "inversify";
import { IExpenseBroadcaster } from "./expense-broadcaster-interface";
import { IExpenseDto } from "@splitsies/shared-models";
import { IConnectionConfiguration } from "src/models/configuration/connection/connection-configuration-interface";
import { IConnectionService } from "src/services/connection-service/connection-service-interface";
import { sendMessage } from "@libs/broadcast";
import { ILogger } from "@splitsies/utils";
import { IExpenseService } from "src/services/expense-service/expense-service-interface";

@injectable()
export class ExpenseBroadcaster implements IExpenseBroadcaster {
    constructor(
        @inject(ILogger) private readonly _logger: ILogger,
        @inject(IConnectionConfiguration) private readonly _connectionConfiguration: IConnectionConfiguration,
        @inject(IConnectionService) private readonly _connectionService: IConnectionService,
        @inject(IExpenseService) private readonly _expenseService: IExpenseService,
    ) {}

    async broadcast(expense: IExpenseDto): Promise<void> {
        // See local-emulation/queue-runner for setting up local listening to DynamoDB Stream
        return this._expenseService.queueExpenseUpdate(expense);
    }

    async notify(expense: IExpenseDto): Promise<void> {
        const connections = await this._connectionService.getConnectionsForExpenseId(expense.id);

        const promises: Promise<void>[] = [];
        for (const connection of connections) {
            if (connection.gatewayUrl !== this._connectionConfiguration.gatewayUrl) continue;
            try {
                promises.push(sendMessage(connection.gatewayUrl, connection.connectionId, expense));
            } catch (e) {
                this._logger.error(`uncaught exception broadcasting for connection ${connection}`, e);
            }
        }

        await Promise.all(promises);
    }
}
