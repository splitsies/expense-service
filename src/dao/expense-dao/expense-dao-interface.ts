import { IExpense } from "@splitsies/shared-models";
import { IExpenseUpdate } from "src/models/expense-update/expense-update-interface";

export interface IExpenseDao {
    upsert(expense: IExpense): Promise<IExpense>;
    read(id: string): Promise<IExpense>;
    update(id: string, update: IExpenseUpdate): Promise<IExpense>;
    delete(id: string): Promise<void>;
}

export const IExpenseDao = Symbol.for("IExpenseDao");
