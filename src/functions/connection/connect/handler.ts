import "reflect-metadata";
import schema from "./schema";
import { ExpectedError, ILogger, SplitsiesFunctionHandlerFactory } from "@splitsies/utils";
import { container } from "src/di/inversify.config";
import { DataResponse, HttpStatusCode, IExpenseDto, InvalidArgumentsError } from "@splitsies/shared-models";
import { IConnectionService } from "src/services/connection-service/connection-service-interface";
import { IExpenseService } from "src/services/expense-service/expense-service-interface";
import { UnauthorizedUserError } from "src/models/error/unauthorized-user-error";
import { IJwtStrategyProvider } from "src/providers/jwt-strategy-provider/jwt-strategy-provider-interface";

const logger = container.get<ILogger>(ILogger);
const connectionService = container.get<IConnectionService>(IConnectionService);
const expenseService = container.get<IExpenseService>(IExpenseService);
const jwtStrategyProvider = container.get<IJwtStrategyProvider>(IJwtStrategyProvider);

const expectedErrors = [
    new ExpectedError(InvalidArgumentsError, HttpStatusCode.BAD_REQUEST, "invalid request"),
    new ExpectedError(UnauthorizedUserError, HttpStatusCode.UNAUTHORIZED, "unauthorized to connect to expense"),
];

export const main = SplitsiesFunctionHandlerFactory.create<typeof schema, IExpenseDto | string>(
    logger,
    async ({ requestContext, queryStringParameters: { expenseId, authToken } }) => {
        if (!expenseId || !authToken || !requestContext.connectionId) throw new InvalidArgumentsError();
        logger.log("connecting...");
        let userId = "";

        try {
            const policy = await jwtStrategyProvider.provide().authenticate(authToken);
            userId = policy.context.userId as string;
        } catch (e) {
            logger.error(`Unauthorized user connection attempt to ${expenseId}`, e);
            throw new UnauthorizedUserError();
        }

        const connectionId = requestContext.connectionId;
        logger.log("getting user expense");
        const userExpense = await expenseService.getUserExpense(userId, expenseId);
        logger.log(`${userExpense}`);

        if (!userExpense) {
            logger.error(`No expense found for user ${userId} expense ${expenseId}`);
            throw new UnauthorizedUserError();
        }

        logger.log("getting expense");
        const expense = await expenseService.getExpense(userExpense.expenseId);
        logger.log(`${expense}`);
        await connectionService.create(connectionId, expenseId);
        return new DataResponse(HttpStatusCode.OK, expense).toJson();
    },
    expectedErrors,
);
