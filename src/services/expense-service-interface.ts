import { IExpense } from "./expense-service";

export interface IExpenseService {
  createExpense(): IExpense;
  createExpenseFromImage(base64Image: string): IExpense;
  updateExpense(id: string, updated: Omit<IExpense, "id">): IExpense;
}

export const IExpenseService: symbol = Symbol.for("IExpenseService");
