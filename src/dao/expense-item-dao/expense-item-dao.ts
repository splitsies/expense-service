import { IExpenseItem } from "@splitsies/shared-models";
import { DaoBase, ILogger } from "@splitsies/utils";
import { inject, injectable } from "inversify";
import { IExpenseItemDao, Key } from "./expense-item-dao-interface";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";

@injectable()
export class ExpenseItemDao extends DaoBase<IExpenseItem, Key> implements IExpenseItemDao {
    constructor(
        @inject(ILogger) logger: ILogger,
        @inject(IDbConfiguration) private readonly dbConfiguration: IDbConfiguration,
    ) {
        super(logger, dbConfiguration, dbConfiguration.expenseItemTableName, (m) => ({
            id: m.id,
            expenseId: m.expenseId,
        }));
    }

    async getForExpense(expenseId: string): Promise<IExpenseItem[]> {
        const items = await this.queryAll({
            TableName: this.dbConfiguration.expenseItemTableName,
            KeyConditionExpression: "#expenseId = :expenseId",
            ExpressionAttributeNames: { "#expenseId": "expenseId" },
            ExpressionAttributeValues: { ":expenseId": { S: expenseId } },
        });

        return items.sort((a, b) => a.createdAt - b.createdAt);
    }
}
