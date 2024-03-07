import { inject, injectable } from "inversify";
import { IExpenseBroadcaster } from "./expense-broadcaster-interface";
import { IExpenseMessage } from "@splitsies/shared-models";
import { IConnectionConfiguration } from "src/models/configuration/connection/connection-configuration-interface";
import { IConnectionService } from "src/services/connection-service/connection-service-interface";
import { sendMessage } from "@libs/broadcast";

@injectable()
export class ExpenseBroadcaster implements IExpenseBroadcaster {
    constructor(
        @inject(IConnectionConfiguration) private readonly _connectionConfiguration: IConnectionConfiguration,
        @inject(IConnectionService) private readonly _connectionService: IConnectionService,
    ) {}

    async broadcast(expenseId: string, message: IExpenseMessage): Promise<void> {
        console.log("broadcasting...");
        this._connectionConfiguration.gatewayUrl;
        const connectionIds = await this._connectionService.getConnectionsForExpenseId(expenseId);

        const promises: Promise<void>[] = [];
        for (const id of connectionIds) {
            console.log({ id });

            try {
                promises.push(sendMessage(this._connectionConfiguration.gatewayUrl, id, message));
            } catch (e) {
                console.log(`the error is ${e}`);
            }
        }

        await Promise.all(promises);
    }
}
