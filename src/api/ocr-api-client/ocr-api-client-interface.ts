import { IDataResponse, IOcrResult } from "@splitsies/shared-models";

export interface IOcrApiClient {
    processImage(base64Image: string): Promise<IDataResponse<IOcrResult>>;
}

export const IOcrApiClient = Symbol.for("IOcrApiClient");
