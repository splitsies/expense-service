import { IExpenseDto } from "@splitsies/shared-models";
import { Expense } from "src/models/expense";

export interface IExpenseWriteStrategy {
    delete(id: string, transaction?: Promise<boolean>): Promise<void>;
    create(userId: string, dto?: IExpenseDto): Promise<Expense>;
    updateTransactionDate(id: string, newTransactionDate: Date): Promise<void>;
}

export const IExpenseWriteStrategy = Symbol.for("IExpenseWriteStrategy");
