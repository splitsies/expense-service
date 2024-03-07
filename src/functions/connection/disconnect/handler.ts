import "reflect-metadata";
import schema from "./schema";
import { ILogger, SplitsiesFunctionHandlerFactory } from "@splitsies/utils";
import { container } from "src/di/inversify.config";
import { DataResponse, HttpStatusCode } from "@splitsies/shared-models";
import { IConnectionService } from "src/services/connection-service/connection-service-interface";
import { deleteConnection } from "@libs/broadcast";
import { IConnectionConfiguration } from "src/models/configuration/connection/connection-configuration-interface";

const logger = container.get<ILogger>(ILogger);
const connectionService = container.get<IConnectionService>(IConnectionService);
const connectionConfiguration = container.get<IConnectionConfiguration>(IConnectionConfiguration);

export const main = SplitsiesFunctionHandlerFactory.create<typeof schema, any>(logger, async (event) => {
    await connectionService.delete(event.requestContext.connectionId);
    await deleteConnection(connectionConfiguration.gatewayUrl, event.requestContext.connectionId);
    return new DataResponse(HttpStatusCode.OK, undefined).toJson();
});
