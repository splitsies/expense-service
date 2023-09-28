import { inject, injectable } from "inversify";
import { ILogger, SplitsiesApiClientBase } from "@splitsies/utils";
import { IApiConfiguration } from "src/models/configuration/api/api-configuration-interface";
import { IUsersApiClient } from "./users-api-client-interface";
import { DataResponse, IDataResponse, IUserDto } from "@splitsies/shared-models";

@injectable()
export class UsersApiClient extends SplitsiesApiClientBase implements IUsersApiClient {
    constructor(
        @inject(ILogger) private readonly _logger: ILogger,
        @inject(IApiConfiguration) private readonly _apiConfiguration: IApiConfiguration,
    ) {
        super();
    }

    async getById(id: string): Promise<IDataResponse<IUserDto>> {
        try {
            console.log({ route: `${this._apiConfiguration.uri.users}/${id}` });
            const result = await this.get<IUserDto>(`${this._apiConfiguration.uri.users}${id}`);

            if (!result?.success) {
                this._logger.error(`Error on request: ${result.data}`);
            }

            return result;
        } catch (e) {
            this._logger.error(`Error on request: ${e}`);
            return new DataResponse(e.statusCode, undefined);
        }
    }
}
