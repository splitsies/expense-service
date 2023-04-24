import { inject, injectable } from "inversify";
import { IExpense } from "@splitsies/shared-models";
import { IExpenseService } from "./expense-service-interface";
import { IExpenseEngine } from "../engines/expense-engine-interface";

@injectable()
export class ExpenseService implements IExpenseService {
    constructor(@inject(IExpenseEngine) private readonly _expenseEngine: IExpenseEngine) {}

    createExpense(): IExpense {
        return this._expenseEngine.createExpense();
    }

    createExpenseFromImage(base64Image: string): IExpense {
        const result = null; // TODO: ocrApi.recognize(base64Image);
        return this._expenseEngine.createExpenseFromImage(result);
    }

    updateExpense(id: string, updated: Omit<IExpense, "id">): IExpense {
        return this._expenseEngine.updateExpense(id, updated);
    }
}