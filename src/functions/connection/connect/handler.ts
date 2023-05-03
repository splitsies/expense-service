import "reflect-metadata";
import schema from "./schema";
import { ILogger, SplitsiesFunctionHandlerFactory } from "@splitsies/utils";
import { container } from "src/di/inversify.config";
import { DataResponse, HttpStatusCode, IExpense } from "@splitsies/shared-models";
import { IConnectionService } from "src/services/connection-service/connection-service-interface";
import { IExpenseService } from "src/services/expense-service/expense-service-interface";

const logger = container.get<ILogger>(ILogger);
const connectionService = container.get<IConnectionService>(IConnectionService);
const expenseService = container.get<IExpenseService>(IExpenseService);

export const main = SplitsiesFunctionHandlerFactory.create<typeof schema, IExpense | string>(
    logger,
    async ({ requestContext: { connectionId }, queryStringParameters: { expenseId } }) => {
        if (!expenseId) {
            return new DataResponse(HttpStatusCode.BAD_REQUEST, "No parameter was given for 'expenseId'").toJson();
        }

        if (!connectionId) {
            return new DataResponse(HttpStatusCode.BAD_REQUEST, "No connection id was found").toJson();
        }

        const expense = await expenseService.getExpense(expenseId);
        if (!expense) return new DataResponse(HttpStatusCode.NOT_FOUND, "No expense was found for given id").toJson();

        await connectionService.create(connectionId, expenseId);
        return new DataResponse(HttpStatusCode.OK, expense).toJson();
    },
);
