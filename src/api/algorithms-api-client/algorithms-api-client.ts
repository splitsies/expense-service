import { SplitsiesApiClientBase } from "@splitsies/utils";
import { inject, injectable } from "inversify";
import { IAlgorithmsApiClient } from "./algorithms-api-client-interface";
import { IOcrResult, IDataResponse, IExpense } from "@splitsies/shared-models";
import { IAlgorithmsApiConfiguration } from "src/models/configuration/algorithms-api/algorithms-api-configuration-interface";
import { IExpenseDto } from "src/models/expense-dto/expense-dto-interface";

@injectable()
export class AlgorithmsApiClient extends SplitsiesApiClientBase implements IAlgorithmsApiClient {
    constructor(@inject(IAlgorithmsApiConfiguration) private readonly _configuration: IAlgorithmsApiConfiguration) {
        super();
    }

    async processImage(ocrResult: IOcrResult): Promise<IDataResponse<IExpenseDto>> {
        return await this.postJson<IExpenseDto>(`${this._configuration.uri}expense/image`, ocrResult);
    }
}
