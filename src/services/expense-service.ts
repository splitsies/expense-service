import { inject, injectable } from "inversify";
import { IExpense } from "@splitsies/shared-models";
import { IExpenseService } from "./expense-service-interface";
import { IExpenseEngine } from "../engines/expense-engine-interface";
import { IOcrApi } from "../api/ocr-api/ocr-api-client-interface";

@injectable()
export class ExpenseService implements IExpenseService {
    constructor(
        @inject(IExpenseEngine) private readonly _expenseEngine: IExpenseEngine,
        @inject(IOcrApi) private readonly _ocrApi: IOcrApi,
    ) {}

    async createExpense(): Promise<IExpense> {
        return Promise.resolve(this._expenseEngine.createExpense());
    }

    async createExpenseFromImage(base64Image: string): Promise<IExpense> {
        const result = await this._ocrApi.processImage(base64Image);
        return this._expenseEngine.createExpenseFromImage(result.data);
    }

    async updateExpense(id: string, updated: Omit<IExpense, "id" | "subtotal" | "total">): Promise<IExpense> {
        return Promise.resolve(this._expenseEngine.updateExpense(id, updated));
    }
}
