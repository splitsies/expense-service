import { IDao } from "@splitsies/utils";
import { ExpenseGroupAssociationDa } from "src/models/expense-group-association-da";

export interface IExpenseGroupAssociationDao extends IDao<ExpenseGroupAssociationDa> {
    getGroupExpenseIds(parentExpenseId: string): Promise<string[]>;
}
export const IExpenseGroupAssociationDao = Symbol.for("IExpenseGroupAssociationDao");
