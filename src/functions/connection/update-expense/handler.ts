import "reflect-metadata";
import schema from "./schema";
import { ExpectedError, ILogger, SplitsiesFunctionHandlerFactory } from "@splitsies/utils";
import { container } from "src/di/inversify.config";
import { DataResponse, HttpStatusCode, IExpenseUpdate } from "@splitsies/shared-models";
import { IConnectionService } from "src/services/connection-service/connection-service-interface";
import { middyfyWs } from "@libs/lambda";
import { IExpenseService } from "src/services/expense-service/expense-service-interface";
import { sendMessage } from "@libs/broadcast";
import { IConnectionConfiguration } from "src/models/configuration/connection/connection-configuration-interface";
import { MismatchedExpenseError } from "src/models/error/mismatched-expense-error";

const logger = container.get<ILogger>(ILogger);
const connectionService = container.get<IConnectionService>(IConnectionService);
const expenseService = container.get<IExpenseService>(IExpenseService);
const connectionConfiguration = container.get<IConnectionConfiguration>(IConnectionConfiguration);

const expectedErrors = [
    new ExpectedError(MismatchedExpenseError, HttpStatusCode.FORBIDDEN, "Cannot update this expense in this session"),
];

export const main = middyfyWs(
    SplitsiesFunctionHandlerFactory.create<typeof schema, any>(
        logger,
        async (event) => {
            await connectionService.refreshTtl(event.requestContext.connectionId);
            const updated = await expenseService.updateExpense(event.body.id, event.body.expense as IExpenseUpdate);
            const relatedConnectionIds = await connectionService.getRelatedConnections(
                event.requestContext.connectionId,
            );

            await Promise.all(
                relatedConnectionIds.map((id) => sendMessage(connectionConfiguration.gatewayUrl, id, updated)),
            );
            return new DataResponse(HttpStatusCode.OK, updated).toJson();
        },
        expectedErrors,
    ),
);
