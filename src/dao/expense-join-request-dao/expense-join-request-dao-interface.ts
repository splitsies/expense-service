import { IExpenseJoinRequest, IScanResult } from "@splitsies/shared-models";
import { IDao } from "@splitsies/utils";
import { AttributeValue } from "@aws-sdk/client-dynamodb/dist-types/models/models_0";

export interface IExpenseJoinRequestDao extends IDao<IExpenseJoinRequest> {
    readonly key: (model: IExpenseJoinRequest) => Record<string, string | number>;
    getForUser(userId: string): Promise<IExpenseJoinRequest[]>;
    getForExpense(expenseId: string): Promise<IExpenseJoinRequest[]>;
    getForExpensesIncludingUser(
        expenseIds: string[],
        userId: string,
        lastKey?: Record<string, AttributeValue> | undefined,
    ): Promise<IScanResult<IExpenseJoinRequest>>;
}
export const IExpenseJoinRequestDao = Symbol.for("IExpenseJoinRequestDao");
