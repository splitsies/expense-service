import { IExpenseDto } from "@splitsies/shared-models";
import { IExpenseDa } from "src/models/expense/expense-da-interface";

export interface IExpenseWriteStrategy {
    delete(id: string): Promise<void>;
    create(userId: string, dto?: IExpenseDto): Promise<IExpenseDa>;
}

export const IExpenseWriteStrategy = Symbol.for("IExpenseWriteStrategy");
