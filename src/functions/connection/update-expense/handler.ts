import "reflect-metadata";
import schema from "./schema";
import { ILogger, SplitsiesFunctionHandlerFactory } from "@splitsies/utils";
import { container } from "src/di/inversify.config";
import { DataResponse, HttpStatusCode } from "@splitsies/shared-models";
import { IConnectionService } from "src/services/connection-service/connection-service-interface";
import { middyfyWs } from "@libs/lambda";
import { IExpenseService } from "src/services/expense-service-interface";
import { sendMessage } from "@libs/broadcast";
import { IExpenseUpdate } from "src/models/expense-update/expense-update-interface";

const logger = container.get<ILogger>(ILogger);

const connectionService = container.get<IConnectionService>(IConnectionService);
const expenseService = container.get<IExpenseService>(IExpenseService);

export const main = middyfyWs(
    SplitsiesFunctionHandlerFactory.create<typeof schema, any>(logger, async (event) => {
        const expenseId = await connectionService.getExpenseIdForConnection(event.requestContext.connectionId);

        if (expenseId !== event.body.id) {
            logger.warn(`connection for expenseId=${expenseId} attempted to update expenseId=${event.body.id}`);
            return new DataResponse(HttpStatusCode.BAD_REQUEST, "Cannot update requested expense with this connection");
        }

        const updated = await expenseService.updateExpense(expenseId, event.body.expense as IExpenseUpdate);
        const relatedConnectionIds = await connectionService.getRelatedConnections(event.requestContext.connectionId);

        await Promise.all(relatedConnectionIds.map((id) => sendMessage(process.env.APIG_URL, id, updated)));
        return new DataResponse(HttpStatusCode.OK, undefined).toJson();
    }),
);
