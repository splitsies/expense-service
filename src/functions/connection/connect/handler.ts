import "reflect-metadata";
import schema from "./schema";
import { ExpectedError, ILogger, SplitsiesFunctionHandlerFactory } from "@splitsies/utils";
import { container } from "src/di/inversify.config";
import { DataResponse, HttpStatusCode, IExpenseDto, InvalidArgumentsError } from "@splitsies/shared-models";
import { IConnectionService } from "src/services/connection-service/connection-service-interface";
import { IExpenseService } from "src/services/expense-service/expense-service-interface";
import { UnauthorizedUserError } from "src/models/error/unauthorized-user-error";
import { IExpenseBroadcaster } from "@libs/expense-broadcaster/expense-broadcaster-interface";
import { deleteConnection } from "@libs/broadcast";
import { IConnectionConfiguration } from "src/models/configuration/connection/connection-configuration-interface";

const logger = container.get<ILogger>(ILogger);
const connectionService = container.get<IConnectionService>(IConnectionService);
const expenseService = container.get<IExpenseService>(IExpenseService);
const expenseBroadcaster = container.get<IExpenseBroadcaster>(IExpenseBroadcaster);
const connectionConfiguration = container.get<IConnectionConfiguration>(IConnectionConfiguration);

const expectedErrors = [
    new ExpectedError(InvalidArgumentsError, HttpStatusCode.BAD_REQUEST, "invalid request"),
    new ExpectedError(UnauthorizedUserError, HttpStatusCode.UNAUTHORIZED, "unauthorized to connect to expense"),
];

export const main = SplitsiesFunctionHandlerFactory.create<typeof schema, IExpenseDto | string>(
    logger,
    async ({ requestContext, queryStringParameters: { expenseId, userId, connectionToken, ping } }) => {
        if (ping) {
            await deleteConnection(connectionConfiguration.gatewayUrl, requestContext.connectionId);
            return new DataResponse(HttpStatusCode.OK, null).toJson();
        }

        if (!expenseId || !userId || !connectionToken || !requestContext.connectionId)
            throw new InvalidArgumentsError();

        if (!(await connectionService.verifyConnectionToken(connectionToken, expenseId))) {
            throw new UnauthorizedUserError();
        }

        const connectionId = requestContext.connectionId;
        const userExpense = await expenseService.getUserExpense(userId, expenseId);

        if (!userExpense) {
            logger.error(`No expense found for user ${userId} expense ${expenseId}`);
            throw new UnauthorizedUserError();
        }
        const leadingExpenseId = await expenseService.getLeadingExpenseId(userExpense.expenseId);
        const expense = await expenseService.getExpense(leadingExpenseId);
        await connectionService.create(connectionId, expense.id);
        await expenseBroadcaster.broadcast(expense);
        return new DataResponse(HttpStatusCode.OK, expense).toJson();
    },
    expectedErrors,
);
