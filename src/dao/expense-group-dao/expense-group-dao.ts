import { inject, injectable } from "inversify";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";
import { DaoBase, IDynamoDbTransactionStrategy, ILogger } from "@splitsies/utils";
import { ExpenseGroup, Key } from "src/models/expense-group";
import { IExpenseGroupDao } from "./expense-group-dao-interface";
import { QueryCommand } from "@aws-sdk/client-dynamodb";
import { NotFoundError } from "@splitsies/shared-models";
import { InvalidStateError } from "src/models/error/invalid-state-error";

@injectable()
export class ExpenseGroupDao extends DaoBase<ExpenseGroup, Key> implements IExpenseGroupDao {
    constructor(
        @inject(ILogger) logger: ILogger,
        @inject(IDbConfiguration) protected readonly _dbConfiguration: IDbConfiguration,
        @inject(IDynamoDbTransactionStrategy) private readonly _transactionStrategy: IDynamoDbTransactionStrategy,
    ) {
        super(logger, _dbConfiguration, _dbConfiguration.expenseGroupTableName, (m) => ({
            parentExpenseId: m.parentExpenseId,
            childExpenseId: m.childExpenseId,
        }));
    }

    async create(model: ExpenseGroup, shouldCommit?: Promise<boolean> | undefined): Promise<ExpenseGroup> {
        await this.validateExpenseGroup(model);

        return await this.run(
            async () => {
                await this._transactionStrategy.execute([
                    this.putCommand(model),
                    this.putCommand(model, this._dbConfiguration.expenseGroupChildIndexName),
                ]);

                return model;
            },
            this._transactionFactory.create(shouldCommit, async (id) => {
                this._logger.warn(
                    `OPERATION ROLLBACK ${id}: CREATE failed on ${this._tableName}, ${this._dbConfiguration.expenseGroupChildIndexName}. Attempting to DELETE item:`,
                    this.keyFrom(model),
                );
                const rollbackOps = [
                    this.deleteCommand(model),
                    this.deleteCommand(model, this._dbConfiguration.expenseGroupChildIndexName),
                ];

                await this._transactionStrategy.execute(rollbackOps);
            }),
        );
    }

    async update(updated: ExpenseGroup, shouldCommit?: Promise<boolean> | undefined): Promise<ExpenseGroup> {
        await this.validateExpenseGroup(updated);
        const existing = await this.read(this.keyFrom(updated));
        if (!existing) {
            throw new NotFoundError();
        }

        return await this.run(
            async () => await this.create(updated),
            this._transactionFactory.create(shouldCommit, async (id) => {
                this._logger.warn(
                    `OPERATION ROLLBACK ${id}: UPDATE failed on ${this._tableName},${this._dbConfiguration.expenseGroupChildIndexName}. Attempting to UPDATE item:`,
                    existing,
                );
                const rollbackOps = [
                    this.putCommand(existing),
                    this.putCommand(existing, this._dbConfiguration.expenseGroupChildIndexName),
                ];

                await this._transactionStrategy.execute(rollbackOps);
            }),
        );
    }

    async delete(key: Key, shouldCommit?: Promise<boolean> | undefined): Promise<void> {
        const existing = await this.read(key);
        if (!existing) return;

        return await this.run(
            async () => {
                await this._transactionStrategy.execute([
                    this.deleteCommand(key),
                    this.deleteCommand(key, this._dbConfiguration.expenseGroupChildIndexName),
                ]);
            },
            this._transactionFactory.create(shouldCommit, async (id) => {
                if (await this.read(key)) return;

                this._logger.warn(
                    `OPERATION ROLLBACK ${id}: DELETE failed on ${this._tableName} and ${this._dbConfiguration.expenseGroupChildIndexName}. Attempting to CREATE item:`,
                    existing,
                );

                const rollbackOps = [
                    this.putCommand(existing),
                    this.putCommand(existing, this._dbConfiguration.expenseGroupChildIndexName),
                ];

                await this._transactionStrategy.execute(rollbackOps);
            }),
        );
    }

    async getParentExpenseId(childExpenseId: string): Promise<string | undefined> {
        const result = await this._client.send(
            new QueryCommand({
                TableName: this._dbConfiguration.expenseGroupChildIndexName,
                KeyConditionExpression: "#childExpenseId = :childExpenseId",
                ExpressionAttributeNames: { "#childExpenseId": "childExpenseId" },
                ExpressionAttributeValues: { ":childExpenseId": { S: childExpenseId } },
            }),
        );

        if (result && result.Items.length > 1) {
            this._logger.error(`Found multiple parent ids for childExpenseId=${childExpenseId}`);
        }

        return this.unmarshall(result?.Items[0])?.parentExpenseId;
    }

    async getChildExpenseIds(parentExpenseId: string): Promise<string[]> {
        const records = await this.queryAll({
            TableName: this._tableName,
            KeyConditionExpression: "#parentExpenseId = :parentExpenseId",
            ExpressionAttributeNames: { "#parentExpenseId": "parentExpenseId" },
            ExpressionAttributeValues: { ":parentExpenseId": { S: parentExpenseId } },
        });

        return records.map((r) => r.childExpenseId);
    }

    private async validateExpenseGroup(model: ExpenseGroup): Promise<void> {
        if (await this.getParentExpenseId(model.parentExpenseId)) {
            throw new InvalidStateError(
                `Expense Group ${JSON.stringify(model)} failed validation checks: parentExpenseId=${
                    model.parentExpenseId
                } exists as a child`,
            );
        }

        if ((await this.getChildExpenseIds(model.childExpenseId)).length) {
            throw new InvalidStateError(
                `Expense Group ${JSON.stringify(model)} failed validation checks: childExpenseId=${
                    model.childExpenseId
                } exists as a parent`,
            );
        }
    }
}
