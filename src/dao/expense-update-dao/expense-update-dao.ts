import { inject, injectable } from "inversify";
import { IExpenseUpdateDao } from "./expense-update-dao-interface";
import { DaoBase, ILogger } from "@splitsies/utils";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";
import { IExpenseUpdate } from "src/models/expense-update/expense-update-interface";
import { marshall, marshallOptions } from "@aws-sdk/util-dynamodb";
import { BatchWriteItemCommand, BatchWriteItemCommandOutput } from "@aws-sdk/client-dynamodb";

@injectable()
export class ExpenseUpdateDao extends DaoBase<IExpenseUpdate> implements IExpenseUpdateDao {
    private readonly _maxBatchSize = 25;
    private readonly _marshallOptions: marshallOptions = { convertClassInstanceToMap: true };
    readonly key: (expenseUpdate: IExpenseUpdate) => Record<string, string | number>;

    constructor(
        @inject(ILogger) logger: ILogger,
        @inject(IDbConfiguration) dbConfiguration: IDbConfiguration,
    ) {
        const keySelector = (c: IExpenseUpdate) => ({ id: c.id, timestamp: c.timestamp });
        super(logger, dbConfiguration, dbConfiguration.expenseUpdateTableName, keySelector);
        this.key = keySelector;
    }

    async deleteBatch(records: IExpenseUpdate[]): Promise<void> {
        const promises: Promise<BatchWriteItemCommandOutput>[] = [];

        for (let offset = 0; offset < records.length; offset += this._maxBatchSize) {
            const chunk = records.slice(offset, offset + this._maxBatchSize);

            promises.push(this._client.send(new BatchWriteItemCommand({
                RequestItems: {
                    [this._tableName]: chunk.map(r => ({
                        "DeleteRequest": {
                            Key: marshall(this.key(r), this._marshallOptions)
                        }
                    }))
                }
            })));
        }

        await Promise.all(promises);
    }
}
