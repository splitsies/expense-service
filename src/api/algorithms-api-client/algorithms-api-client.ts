import { SplitsiesApiClientBase } from "@splitsies/utils";
import { inject, injectable } from "inversify";
import { IAlgorithmsApiClient } from "./algorithms-api-client-interface";
import { IOcrResult, IDataResponse, IExpenseDto } from "@splitsies/shared-models";
import { IApiConfiguration } from "src/models/configuration/api/api-configuration-interface";

@injectable()
export class AlgorithmsApiClient extends SplitsiesApiClientBase implements IAlgorithmsApiClient {
    constructor(@inject(IApiConfiguration) private readonly _configuration: IApiConfiguration) {
        super();
    }

    async processImage(ocrResult: IOcrResult): Promise<IDataResponse<IExpenseDto>> {
        return await this.postJson<IExpenseDto>(`${this._configuration.uri.algorithms}expense/image`, ocrResult);
    }
}
