import { inject, injectable } from "inversify";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";
import { DaoBase, ILogger } from "@splitsies/utils";
import { ExpenseGroup, Key } from "src/models/expense-group";
import { IExpenseGroupDao } from "./expense-group-dao-interface";
import { QueryCommand } from "@aws-sdk/client-dynamodb";
import { InvalidStateError } from "src/models/error/invalid-state-error";

@injectable()
export class ExpenseGroupDao extends DaoBase<ExpenseGroup, Key> implements IExpenseGroupDao {
    constructor(
        @inject(ILogger) logger: ILogger,
        @inject(IDbConfiguration) protected readonly _dbConfiguration: IDbConfiguration,
    ) {
        super(logger, _dbConfiguration, _dbConfiguration.expenseGroupTableName, (m) => ({
            parentExpenseId: m.parentExpenseId,
            childExpenseId: m.childExpenseId,
        }));
    }

    async create(model: ExpenseGroup, shouldCommit?: Promise<boolean> | undefined): Promise<ExpenseGroup> {
        this.validateExpenseGroup(model);
        return super.create(model, shouldCommit);
    }

    async update(updated: ExpenseGroup, shouldCommit?: Promise<boolean> | undefined): Promise<ExpenseGroup> {
        this.validateExpenseGroup(updated);
        return super.update(updated, shouldCommit);
    }

    async getParentExpenseId(childExpenseId: string): Promise<string | undefined> {
        const result = await this._client.send(
            new QueryCommand({
                TableName: this._tableName,
                IndexName: this._dbConfiguration.expenseGroupChildIndexName,
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
