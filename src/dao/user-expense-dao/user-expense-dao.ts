import { DaoBase, IDynamoDbTransactionStrategy, ILogger, IPageInfoMapper } from "@splitsies/utils";
import { inject, injectable } from "inversify";
import { IUserExpense } from "src/models/user-expense/user-expense-interface";
import { IUserExpenseDao } from "./user-expense-dao-interface";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";
import { IScanResult, NotFoundError, ScanResult } from "@splitsies/shared-models";
import { AttributeValue, QueryCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { Key, UserExpenseDa } from "src/models/user-expense-da";
import { IUserExpenseDaMapper } from "src/mappers/user-expense-mapper/user-expense-mapper.i";
import { UserExpense } from "src/models/user-expense/user-expense";

@injectable()
export class UserExpenseDao extends DaoBase<UserExpenseDa, Key, UserExpense> implements IUserExpenseDao {
    constructor(
        @inject(ILogger) logger: ILogger,
        @inject(IDbConfiguration) protected readonly _dbConfiguration: IDbConfiguration,
        @inject(IDynamoDbTransactionStrategy) private readonly _transactionStrategy: IDynamoDbTransactionStrategy,
        @inject(IUserExpenseDaMapper) protected readonly _mapper: IUserExpenseDaMapper,
        @inject(IPageInfoMapper) private readonly _pageInfoMapper: IPageInfoMapper,
    ) {
        super(
            logger,
            _dbConfiguration,
            _dbConfiguration.userExpenseTableName,
            (m) => ({ userId: m.userId, expenseId: m.expenseId }),
            _mapper,
        );
    }

    async create(model: UserExpense): Promise<UserExpense> {
        await this._transactionStrategy.execute([
            this.putCommand(model),
            this.putCommand(model, this._dbConfiguration.userExpenseUserIndexName),
        ]);

        return model;
    }

    async update(updated: UserExpense): Promise<UserExpense> {
        if (!this.read(this.keyFrom(updated))) {
            throw new NotFoundError();
        }
        return this.create(updated);
    }

    async delete(key: { userId: string; expenseId: string }): Promise<void> {
        await this._transactionStrategy.execute([
            this.deleteCommand(key),
            this.deleteCommand(key, this._dbConfiguration.userExpenseUserIndexName),
        ]);
    }

    async getForUser(userId: string): Promise<IUserExpense[]> {
        const userExpenses = await this.queryAll({
            TableName: this._dbConfiguration.userExpenseUserIndexName,
            KeyConditionExpression: "#userId = :userId",
            ExpressionAttributeNames: { "#userId": "userId" },
            ExpressionAttributeValues: { ":userId": { S: userId } },
        });

        return userExpenses;
    }

    async getUsersForExpense(expenseId: string): Promise<string[]> {
        const userExpenses = await this.queryAll({
            TableName: this._tableName,
            KeyConditionExpression: "#expenseId = :expenseId",
            ExpressionAttributeNames: { "#expenseId": "expenseId" },
            ExpressionAttributeValues: { ":expenseId": { S: expenseId } },
        });

        return userExpenses.map((ue) => ue.userId);
    }

    async getJoinRequestsForUser(
        userId: string,
        limit: number,
        offset: Record<string, object> = undefined,
    ): Promise<IScanResult<IUserExpense>> {
        const res = await this._client.send(
            new QueryCommand({
                TableName: this._dbConfiguration.userExpenseUserIndexName,
                KeyConditionExpression: "#userId = :userId",
                ExpressionAttributeNames: { "#userId": "userId" },
                ExpressionAttributeValues: { ":userId": { S: userId } },
                ExclusiveStartKey: offset as Record<string, AttributeValue>,
            }),
        );

        const userExpenses = this.unmarshallResults(res)
            .sort((a, b) => b.createdAt?.getTime() ?? 0 - a.createdAt?.getTime() ?? 0)
            .slice(0, limit);

        const pageInfo = this._pageInfoMapper.fromFiltered(userExpenses, this.keyFrom.bind(this), limit, offset);
        const scan = new ScanResult<IUserExpense>(userExpenses, pageInfo);
        return scan;
    }

    async getJoinRequestCountForUser(userId: string): Promise<number> {
        const res = await this._client.send(
            new ScanCommand({
                TableName: this._dbConfiguration.userExpenseUserIndexName,
                FilterExpression: "#userId = :userId AND #pendingJoin = :pendingJoin",
                ExpressionAttributeNames: { "#userId": "userId", "#pendingJoin": "pendingJoin" },
                ExpressionAttributeValues: { ":userId": { S: userId }, ":pendingJoin": { BOOL: true } },
                Select: "COUNT",
            }),
        );

        return res.Count ?? 0;
    }

    async getJoinRequestsForExpense(expenseId: string): Promise<IUserExpense[]> {
        const userExpenses = this.queryAll({
            TableName: this._tableName,
            KeyConditionExpression: "#expenseId = :expenseId",
            FilterExpression: "#pendingJoin = :pendoingJoin",
            ExpressionAttributeNames: { "#expenseId": "expenseId" },
            ExpressionAttributeValues: { ":expenseId": { S: expenseId }, ":pendingJoin": { BOOL: true } },
        });

        return userExpenses;
    }

    async deleteForUser(userId: string): Promise<void> {
        const userExpenses = await this.getForUser(userId);

        for (let slice = 0; slice < userExpenses.length; slice += 50) {
            const ues = userExpenses.slice(slice, slice + 50);

            const result = this._transactionStrategy.execute(
                ues.flatMap((ue) => [
                    this.deleteCommand(this.keyFrom(ue)),
                    this.deleteCommand(this.keyFrom(ue), this._dbConfiguration.userExpenseUserIndexName),
                ]),
            );

            if (!result) {
                this._logger.error(
                    "Transaction to delete user expenses failed.",
                    ues.map((ue) => JSON.stringify(this.keyFrom(ue))),
                );
            }
        }
    }
}
