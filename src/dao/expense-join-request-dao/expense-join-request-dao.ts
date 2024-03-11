import { DaoBase, ILogger } from "@splitsies/utils";
import { inject, injectable } from "inversify";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";
import { ExecuteStatementCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { IExpenseJoinRequestDao } from "./expense-join-request-dao-interface";
import { IExpenseJoinRequestStatements } from "./expense-join-request-statements-interface";
import {
    IExpenseJoinRequest,
    IExpenseJoinRequestDa,
    IExpenseJoinRequestDaMapper,
    IScanResult,
    ScanResult,
} from "@splitsies/shared-models";
import { AttributeValue } from "@aws-sdk/client-dynamodb/dist-types/models/models_0";

@injectable()
export class ExpenseJoinRequestDao
    extends DaoBase<IExpenseJoinRequest, IExpenseJoinRequestDa>
    implements IExpenseJoinRequestDao
{
    readonly key: (model: IExpenseJoinRequest) => Record<string, string | number>;

    private readonly _chunkSize = 100;

    constructor(
        @inject(ILogger) logger: ILogger,
        @inject(IDbConfiguration) private readonly dbConfiguration: IDbConfiguration,
        @inject(IExpenseJoinRequestDaMapper) protected readonly _mapper: IExpenseJoinRequestDaMapper,
        @inject(IExpenseJoinRequestStatements) private readonly _statements: IExpenseJoinRequestStatements,
    ) {
        const keySelector = (e: IExpenseJoinRequest) => ({ expenseId: e.expenseId, userId: e.userId });
        super(logger, dbConfiguration, dbConfiguration.expenseJoinRequestTableName, keySelector, _mapper);
        this.key = keySelector;
    }

    async getForUser(userId: string): Promise<IExpenseJoinRequest[]> {
        const result = await this._client.send(
            new ExecuteStatementCommand({
                Statement: this._statements.GetForUser,
                Parameters: [{ S: userId }],
            }),
        );

        return result.Items?.length
            ? result.Items.map((i) => this._mapper.toDomainModel(unmarshall(i) as IExpenseJoinRequestDa))
            : [];
    }

    async getForExpense(expenseId: string): Promise<IExpenseJoinRequest[]> {
        const result = await this._client.send(
            new ExecuteStatementCommand({
                Statement: this._statements.GetForExpense,
                Parameters: [{ S: expenseId }],
            }),
        );

        return result.Items?.length
            ? result.Items.map((i) => this._mapper.toDomainModel(unmarshall(i) as IExpenseJoinRequestDa))
            : [];
    }

    async getForExpensesIncludingUser(
        expenseIds: string[],
        userId: string,
        lastKey: Record<string, AttributeValue> | undefined,
    ): Promise<IScanResult<IExpenseJoinRequest>> {
        if (expenseIds.length === 0) new ScanResult([], null);

        const expressionAttributeValues = {};
        const expenseIdParams = expenseIds.map((id, i) => {
            const expenseId = `:id${i}`;
            expressionAttributeValues[expenseId] = { S: id };
            return expenseId;
        });

        const expressionPieces: string[] = [];
        for (let i = 0; i < expenseIdParams.length; i += this._chunkSize) {
            expressionPieces.push(`#expenseId in (${expenseIdParams.slice(i, i + this._chunkSize).join(",")})`);
        }
        // Max 100 operands in IN operator, need to split up if more
        const filterExpression = `(${expressionPieces.join(" OR ")})`;
        const result = await this._client.send(
            new ScanCommand({
                TableName: this.dbConfiguration.expenseJoinRequestTableName,
                ExclusiveStartKey: lastKey,
                FilterExpression: `#userId = :userId AND ${filterExpression}`,
                ExpressionAttributeNames: {
                    "#expenseId": "expenseId",
                    "#userId": "userId",
                },
                ExpressionAttributeValues: {
                    ":userId": { S: userId },
                    ...expressionAttributeValues,
                },
            }),
        );

        const scan = new ScanResult(
            result.Items.map((i) => this._mapper.toDomainModel(unmarshall(i) as IExpenseJoinRequestDa)),
            result.LastEvaluatedKey ?? null,
        );

        return scan;
    }
}
