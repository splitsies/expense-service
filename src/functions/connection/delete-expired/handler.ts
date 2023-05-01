import "reflect-metadata";
import { ILogger, SplitsiesFunctionHandlerFactory } from "@splitsies/utils";
import { container } from "src/di/inversify.config";
import { DataResponse, HttpStatusCode } from "@splitsies/shared-models";
import { IConnectionService } from "src/services/connection-service/connection-service-interface";

const schema = {} as const;
const logger = container.get<ILogger>(ILogger);
const connectionService = container.get<IConnectionService>(IConnectionService);

export const main = SplitsiesFunctionHandlerFactory.create<typeof schema, any>(logger, async (_) => {
    logger.log(`Clearing expired connections at ${Date.now()}`);
    await connectionService.deleteExpired();
    return new DataResponse(HttpStatusCode.OK, undefined).toJson();
});
