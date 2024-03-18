import { inject, injectable } from "inversify";
import { ILogger, SplitsiesApiClientBase } from "@splitsies/utils";
import { IApiConfiguration } from "src/models/configuration/api/api-configuration-interface";
import { IUsersApiClient } from "./users-api-client-interface";
import { DataResponse, HttpStatusCode, IDataResponse, IScanResult, IUserDto } from "@splitsies/shared-models";

@injectable()
export class UsersApiClient extends SplitsiesApiClientBase implements IUsersApiClient {
    private readonly _timeout = 15000;

    constructor(
        @inject(ILogger) private readonly _logger: ILogger,
        @inject(IApiConfiguration) private readonly _apiConfiguration: IApiConfiguration,
    ) {
        super();
    }

    async getById(id: string): Promise<IDataResponse<IUserDto>> {
        try {
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

    async findUsersById(ids: string[]): Promise<IDataResponse<IUserDto[]>> {
        try {
            const url = `${this._apiConfiguration.uri.users}?ids=${ids.join(",")}`;
            const timeout = Date.now() + this._timeout;
            const users: IUserDto[] = [];
            let response: IDataResponse<IScanResult<IUserDto>> = undefined;
            let lastKey = undefined;

            do {
                response = await this.get<IScanResult<IUserDto>>(url + (lastKey ? `&lastKey=${lastKey}` : ""));
                lastKey = response?.data?.lastEvaluatedKey
                    ? encodeURIComponent(JSON.stringify(response.data.lastEvaluatedKey))
                    : undefined;

                if (!response?.success) {
                    this._logger.error(`Error on request: ${response.data}`);
                    continue;
                }

                users.push(...response.data.result);
            } while (response?.data?.lastEvaluatedKey && Date.now() < timeout);

            return new DataResponse(HttpStatusCode.OK, users);
        } catch (e) {
            this._logger.error(`Error on request: ${e}`);
            return new DataResponse(e.statusCode, undefined);
        }
    }
}
