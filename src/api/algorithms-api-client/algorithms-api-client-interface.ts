import { IDataResponse, IExpenseDto, IOcrResult } from "@splitsies/shared-models";

export interface IAlgorithmsApiClient {
    processImage(ocrResult: IOcrResult): Promise<IDataResponse<IExpenseDto>>;
}

export const IAlgorithmsApiClient = Symbol.for("IAlgorithmsApiClient");
