import { DynamoDBClient, PutItemCommand, GetItemCommand, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, marshallOptions, unmarshall } from "@aws-sdk/util-dynamodb";
import { IDtoMapper, ILogger } from "@splitsies/utils";
import { NotFoundError } from "src/models/error/not-found-error";
import { IDao } from "./dao-interface";
import { injectable, unmanaged } from "inversify";

type DatabaseConfiguration = {
    readonly dbAccessKeyId: string;
    readonly dbSecretAccessKey: string;
    readonly dbRegion: string;
    readonly endpoint: string;
};

@injectable()
export abstract class DaoBase<TModel, TDto = void> implements IDao<TModel, string> {
    private readonly _marshallOptions: marshallOptions = { convertClassInstanceToMap: true };

    protected readonly _client: DynamoDBClient;

    constructor(
        protected readonly _logger: ILogger,
        protected readonly _dbConfiguration: DatabaseConfiguration,
        @unmanaged() protected readonly _tableName: string,
        @unmanaged() protected readonly _keySelector: (model: TModel) => Record<string, string | number>,
        protected readonly _mapper: IDtoMapper<TModel, TDto> | undefined = undefined,
    ) {
        this._client = new DynamoDBClient({
            credentials: {
                accessKeyId: this._dbConfiguration.dbAccessKeyId,
                secretAccessKey: this._dbConfiguration.dbSecretAccessKey,
            },
            region: this._dbConfiguration.dbRegion,
            endpoint: this._dbConfiguration.endpoint,
        });
    }

    async create(model: TModel): Promise<TModel> {
        const dataModel = this._mapper?.toDtoModel(model) ?? model;

        const result = await this._client.send(
            new PutItemCommand({
                TableName: this._tableName,
                Item: marshall(dataModel, this._marshallOptions),
            }),
        );

        if (result.$metadata.httpStatusCode !== 200) return undefined;
        return this.read(this._keySelector(model));
    }

    async read(key: Record<string, string | number>): Promise<TModel> {
        const readResult = await this._client.send(
            new GetItemCommand({
                TableName: this._tableName,
                Key: marshall(key, this._marshallOptions),
            }),
        );

        if (!readResult.Item) return undefined;

        const result = unmarshall(readResult.Item);
        return this._mapper ? this._mapper.toDomainModel(result as TDto) : (result as TModel);
    }

    async update(updated: TModel): Promise<TModel> {
        const key = this._keySelector(updated);
        const exists = !!(await this.read(this._keySelector(updated)));
        if (!exists) throw new NotFoundError(`Expense with id=${JSON.stringify(key)} not found`);

        // CREATE and UPDATE are the same in DynamoDB
        return await this.create(updated);
    }

    async delete(key: Record<string, string | number>): Promise<void> {
        await this._client.send(
            new DeleteItemCommand({
                TableName: this._tableName,
                Key: marshall(key, this._marshallOptions),
            }),
        );
    }
}
