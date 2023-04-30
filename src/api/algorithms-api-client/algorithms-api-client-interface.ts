import { IDataResponse, IOcrResult } from "@splitsies/shared-models";
import { IExpenseDto } from "src/models/expense-dto/expense-dto-interface";

export interface IAlgorithmsApiClient {
    processImage(ocrResult: IOcrResult): Promise<IDataResponse<IExpenseDto>>;
}

export const IAlgorithmsApiClient = Symbol.for("IAlgorithmsApiClient");
