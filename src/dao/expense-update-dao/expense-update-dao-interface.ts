import { IDao } from "@splitsies/utils";
import { IExpenseUpdate } from "src/models/expense-update/expense-update-interface";

export interface IExpenseUpdateDao extends IDao<IExpenseUpdate> {
    readonly key: (expenseUpdate: IExpenseUpdate) => Record<string, string | number>;
    deleteBatch(expenseUpdates: IExpenseUpdate[]): Promise<void>;
}
export const IExpenseUpdateDao = Symbol.for("IExpenseUpdateDao");
