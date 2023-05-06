import { inject, injectable } from "inversify";
import { IExpense, IExpenseUpdate } from "@splitsies/shared-models";
import { IExpenseService } from "./expense-service-interface";
import { IAlgorithmsApiClient } from "src/api/algorithms-api-client/algorithms-api-client-interface";
import { ImageProcessingError } from "src/models/error/image-processing-error";
import { IExpenseMapper } from "@splitsies/utils";
import { IExpenseManager } from "src/managers/expense-manager/expense-manager-interface";
import { IOcrApiClient } from "src/api/ocr-api-client/ocr-api-client-interface";

@injectable()
export class ExpenseService implements IExpenseService {
    constructor(
        @inject(IExpenseManager) private readonly _expenseManager: IExpenseManager,
        @inject(IOcrApiClient) private readonly _ocrApiClient: IOcrApiClient,
        @inject(IAlgorithmsApiClient) private readonly _algorithsmApiClient: IAlgorithmsApiClient,
        @inject(IExpenseMapper) private readonly _mapper: IExpenseMapper,
    ) {}

    async getExpense(id: string): Promise<IExpense> {
        return this._expenseManager.getExpense(id);
    }

    async createExpense(): Promise<IExpense> {
        return await this._expenseManager.createExpense();
    }

    async createExpenseFromImage(base64Image: string): Promise<IExpense> {
        const ocrResult = await this._ocrApiClient.processImage(base64Image);
        const expenseResult = await this._algorithsmApiClient.processImage(ocrResult.data);
        if (!expenseResult.success) throw new ImageProcessingError("Could not create expense from image");

        return this._expenseManager.createExpenseFromImage(this._mapper.toDomainModel(expenseResult.data));
    }

    async updateExpense(id: string, updated: IExpenseUpdate): Promise<IExpense> {
        return await this._expenseManager.updateExpense(id, updated);
    }

    async getExpensesForUser(userId: string): Promise<IExpense[]> {
        return await this._expenseManager.getExpensesForUser(userId);
    }
}
