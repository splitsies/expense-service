import { inject, injectable } from "inversify";
import { IExpenseUpdateDao } from "./expense-update-dao-interface";
import { DaoBase, ILogger } from "@splitsies/utils";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";
import { IExpenseUpdate } from "src/models/expense-update/expense-update-interface";
import { marshall, marshallOptions } from "@aws-sdk/util-dynamodb";
import { BatchWriteItemCommand, DeleteItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";

@injectable()
export class ExpenseUpdateDao extends DaoBase<IExpenseUpdate> implements IExpenseUpdateDao {

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
        const result = await this._client.send(new BatchWriteItemCommand({
            RequestItems: {
                [this._tableName]: records.map(r => ({
                    "DeleteRequest": {
                        Key: marshall(this.key(r), this._marshallOptions)
                    }
                }))
            }
        }));

        console.log({ result });
    }

    // override async create(model: IExpenseUpdate): Promise<IExpenseUpdate> {


    //     console.log({ model, tableName: this._tableName, item: marshall(model, this._marshallOptions) });

    //     const result = await this._client.send(
    //         new PutItemCommand({
    //             TableName: this._tableName,
    //             Item: marshall(model, this._marshallOptions),
    //         }),
    //     );

    //     if (result.$metadata.httpStatusCode !== 200) return undefined;
    //     return this.read(this._keySelector(model));
    // }
}
