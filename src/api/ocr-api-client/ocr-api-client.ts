import { inject, injectable } from "inversify";
import { IOcrApiClient as IOcrApiClient } from "./ocr-api-client-interface";
import { IDataResponse, IOcrResult } from "@splitsies/shared-models";
import { ILogger, SplitsiesApiClientBase } from "@splitsies/utils";
import { IApiConfiguration } from "src/models/configuration/api/api-configuration-interface";

@injectable()
export class OcrApiClient extends SplitsiesApiClientBase implements IOcrApiClient {
    constructor(
        @inject(ILogger) private readonly _logger: ILogger,
        @inject(IApiConfiguration) private readonly _configuration: IApiConfiguration,
    ) {
        super();
    }

    async processImage(base64Image: string): Promise<IDataResponse<IOcrResult>> {
        try {
            const result = await this.postJson<IOcrResult>(`${this._configuration.uri.ocr}process`, {
                image: base64Image,
            });
            if (!result?.success) {
                this._logger.error(`Error on request: ${result.data}`);
            }

            return result;
        } catch (e) {
            this._logger.error(`Error on request: ${e}`);
        }
    }
}
