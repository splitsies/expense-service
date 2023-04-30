import "reflect-metadata";
import schema from "./schema";
import { ILogger, SplitsiesFunctionHandlerFactory } from "@splitsies/utils";
import { container } from "src/di/inversify.config";
import { DataResponse, HttpStatusCode } from "@splitsies/shared-models";
import { IExpenseDto } from "src/models/expense-dto/expense-dto-interface";
import { IConnectionService } from "src/services/connection-service/connection-service-interface";
import { NotFoundError } from "src/models/error/not-found-error";

const logger = container.get<ILogger>(ILogger);
const connectionService = container.get<IConnectionService>(IConnectionService);

const h = SplitsiesFunctionHandlerFactory.create<typeof schema, any>(logger, async (event) => {
    console.log(event);
    const {
        body,
        requestContext: { connectionId, routeKey },
    } = event;
    console.log(body, routeKey, connectionId);

    switch (routeKey) {
        case "$connect":
            const expenseId = event.queryStringParameters["expenseId"];
            if (!expenseId) { return new DataResponse(HttpStatusCode.BAD_REQUEST, "No parameter was given for 'expenseId'").toJson(); }

            try {
                await connectionService.create(connectionId, expenseId);
            } catch (e) {
                if (e instanceof NotFoundError) {
                    return new DataResponse(HttpStatusCode.NOT_FOUND, e.message).toJson()
                }
            }           
            
            break;

        case "$disconnect":
            await connectionService.delete(connectionId);
            break;

        case "$default":
        default:
            // find the expense id matching the update?
            console.log("defaulting");
            console.log(JSON.parse(event.body.toString()) as IExpenseDto);
            // const connections = await getAllConnections();
            // await Promise.all(
            //   connections.map(connectionId => sendMessage(connectionId, body))
            // );
            break;
    }

    return new DataResponse(HttpStatusCode.OK, undefined).toJson();
});

export const main = h;
