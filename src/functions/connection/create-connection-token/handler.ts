import schema from "./schema";
import { middyfy } from "../../../libs/lambda";
import { container } from "../../../di/inversify.config";
import { HttpStatusCode, DataResponse } from "@splitsies/shared-models";
import { SplitsiesFunctionHandlerFactory, ILogger } from "@splitsies/utils";
import { IConnectionService } from "src/services/connection-service/connection-service-interface";

const logger = container.get<ILogger>(ILogger);
const connectionService = container.get<IConnectionService>(IConnectionService);

export const main = middyfy(
    SplitsiesFunctionHandlerFactory.create<typeof schema, string>(
        logger,
        async (event) => {
            const token = await connectionService.generateConnectionToken(event.pathParameters.expenseId);
            return new DataResponse(HttpStatusCode.CREATED, token).toJson();
        }
    ),
);
