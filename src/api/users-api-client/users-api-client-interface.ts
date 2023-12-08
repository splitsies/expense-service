import { IDataResponse, IUserDto } from "@splitsies/shared-models";

export interface IUsersApiClient {
    getById(id: string): Promise<IDataResponse<IUserDto>>;
    findUsersById(ids: string[]): Promise<IDataResponse<IUserDto[]>>;
}

export const IUsersApiClient = Symbol.for("IUsersApiClient");
