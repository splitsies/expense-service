import { inject, injectable } from "inversify";
import { IOcrApi as IOcrApiClient } from "./ocr-api-client-interface";
import { IDataResponse, IOcrResult } from "@splitsies/shared-models";
import { ILogger } from "@splitsies/utils";
import { IOcrApiConfiguration } from "../../models/configuration/ocr-api-configuration-interface";
import { SplitsiesApiClientBase } from "@splitsies/utils/lib/src/api/splitsies-api-base";

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
            const response = await this.postJson(`${this._ocrApiConfiguration.uri}process`, { image: base64Image });
            return this.parseResponse(response);
        } catch (e) {
            this._logger.error(`Error on request: ${e}`);
        }
    }
}
