import schema from "./schema";
import { middyfy } from "../../../libs/lambda";
import { container } from "../../../di/inversify.config";
import { IExpenseService } from "../../../services/expense-service/expense-service-interface";
import { HttpStatusCode, DataResponse, ExpensePayload, ExpenseMessage, IExpenseMapper } from "@splitsies/shared-models";
import { SplitsiesFunctionHandlerFactory, ILogger, ExpectedError } from "@splitsies/utils";
import { UnauthorizedUserError } from "src/models/error/unauthorized-user-error";
import { IExpenseBroadcaster } from "@libs/expense-broadcaster/expense-broadcaster-interface";
import { InvalidStateError } from "src/models/error/invalid-state-error";
import { ApiCommunicationError } from "src/models/error/api-communication-error";

const logger = container.get<ILogger>(ILogger);
const expenseService = container.get<IExpenseService>(IExpenseService);
const expenseMapper = container.get<IExpenseMapper>(IExpenseMapper);
const expenseBroadcaster = container.get<IExpenseBroadcaster>(IExpenseBroadcaster);

export const main = middyfy(
    SplitsiesFunctionHandlerFactory.create<typeof schema, void | string>(
        logger,
        async (event) => {
            const expenseId = event.pathParameters.expenseId;
            const userId = event.body.userId;
            await expenseService.addUserToExpense(userId, expenseId, event.requestContext.authorizer.userId);

            const expense = await expenseService.getExpense(expenseId);
            const result = await expenseService.getExpenseUserDetailsForExpenses([expenseId]);
            const users = result.get(expenseId);
            const payload = new ExpensePayload(expenseMapper.toDtoModel(expense), users);

            await expenseBroadcaster.broadcast(expenseId, new ExpenseMessage("payload", payload));
            return new DataResponse(HttpStatusCode.OK, null).toJson();
        },
        [
            new ExpectedError(UnauthorizedUserError, HttpStatusCode.UNAUTHORIZED, "User cannot modify this expense"),
            new ExpectedError(InvalidStateError, HttpStatusCode.BAD_REQUEST, "User was not available to be added"),
            new ExpectedError(ApiCommunicationError, HttpStatusCode.BAD_GATEWAY, "Communication error"),
        ],
    ),
);
