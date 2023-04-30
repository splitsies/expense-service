import { inject, injectable } from "inversify";
import { IExpense } from "@splitsies/shared-models";
import { IExpenseService } from "./expense-service-interface";
import { IExpenseEngine } from "../engines/expense-engine-interface";
import { IOcrApi } from "../api/ocr-api/ocr-api-client-interface";
import { IAlgorithmsApiClient } from "src/api/algorithms-api-client/algorithms-api-client-interface";
import { ImageProcessingError } from "src/models/error/image-processing-error";
import { IExpenseMapper } from "src/mappers/expense-mapper/expense-mapper-interface";

@injectable()
export class ExpenseService implements IExpenseService {
    constructor(
        @inject(IExpenseEngine) private readonly _expenseEngine: IExpenseEngine,
        @inject(IOcrApi) private readonly _ocrApi: IOcrApi,
        @inject(IAlgorithmsApiClient) private readonly _algorithsmApiClient: IAlgorithmsApiClient,
        @inject(IExpenseMapper) private readonly _mapper: IExpenseMapper,
    ) {}

    async createExpense(): Promise<IExpense> {
        return await this._expenseEngine.createExpense();
    }

    async createExpenseFromImage(base64Image: string): Promise<IExpense> {
        const ocrResult = await this._ocrApi.processImage(base64Image);
        const expenseResult = await this._algorithsmApiClient.processImage(ocrResult.data);
        if (!expenseResult.success) throw new ImageProcessingError("Could not create expense from image");

        return this._expenseEngine.createExpenseFromImage(this._mapper.toDomainModel(expenseResult.data));
    }

    async updateExpense(id: string, updated: Omit<IExpense, "id" | "subtotal" | "total">): Promise<IExpense> {
        return await this._expenseEngine.updateExpense(id, updated);
    }
}
