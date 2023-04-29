import { inject, injectable } from "inversify";
import { IOcrApi as IOcrApiClient } from "./ocr-api-client-interface";
import { IDataResponse, IOcrResult } from "@splitsies/shared-models";
import { ILogger, SplitsiesApiClientBase } from "@splitsies/utils";
import { IOcrApiConfiguration } from "../../models/configuration/ocr-api/ocr-api-configuration-interface";

@injectable()
export class OcrApiClient extends SplitsiesApiClientBase implements IOcrApiClient {
    constructor(
        @inject(ILogger) private readonly _logger: ILogger,
        @inject(IOcrApiConfiguration) private readonly _ocrApiConfiguration: IOcrApiConfiguration,
    ) {
        super();
    }

    async processImage(base64Image: string): Promise<IDataResponse<IOcrResult>> {
        try {
            return await this.postJson(`${this._ocrApiConfiguration.uri}process`, { image: base64Image });
        } catch (e) {
            this._logger.error(`Error on request: ${e}`);
        }
    }
}
