import { IDataResponse, IOcrResult } from "@splitsies/shared-models";

export interface IOcrApi {
    processImage(base64Image: string): Promise<IDataResponse<IOcrResult>>;
}

export const IOcrApi = Symbol.for("IOcrApi");
