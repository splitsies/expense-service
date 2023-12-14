import { IExpenseJoinRequest } from "@splitsies/shared-models";
import { IDao } from "@splitsies/utils";

export interface IExpenseJoinRequestDao extends IDao<IExpenseJoinRequest> {
    readonly key: (model: IExpenseJoinRequest) => Record<string, string | number>;
    getForUser(userId: string): Promise<IExpenseJoinRequest[]>;
    getForExpense(expenseId: string): Promise<IExpenseJoinRequest[]>;
}
export const IExpenseJoinRequestDao = Symbol.for("IExpenseJoinRequestDao");
