import "reflect-metadata";
import schema from "./schema";
import { ILogger, SplitsiesFunctionHandlerFactory } from "@splitsies/utils";
import { container } from "src/di/inversify.config";
import { DataResponse, HttpStatusCode } from "@splitsies/shared-models";
import { IConnectionService } from "src/services/connection-service/connection-service-interface";
import { NotFoundError } from "src/models/error/not-found-error";

const logger = container.get<ILogger>(ILogger);
const connectionService = container.get<IConnectionService>(IConnectionService);

export const main = SplitsiesFunctionHandlerFactory.create<typeof schema, any>(logger, async (event) => {
    const connectionId = event.requestContext.connectionId;
    const expenseId = event.queryStringParameters.expenseId;

    if (!expenseId) {
        return new DataResponse(HttpStatusCode.BAD_REQUEST, "No parameter was given for 'expenseId'").toJson();
    }

    if (!connectionId) {
        return new DataResponse(HttpStatusCode.BAD_REQUEST, "No connection id was found").toJson();
    }

    try {
        await connectionService.create(connectionId, expenseId);
        return new DataResponse(HttpStatusCode.OK, undefined).toJson();
    } catch (e) {
        if (e instanceof NotFoundError) {
            return new DataResponse(HttpStatusCode.NOT_FOUND, e.message).toJson();
        }

        throw e;
    }
});
