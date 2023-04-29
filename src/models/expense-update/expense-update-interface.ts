import { IExpense } from "@splitsies/shared-models";

export type IExpenseUpdate = Omit<IExpense, "id" | "subtotal" | "total">;