import schema from "./schema";
import { middyfy } from "../../../libs/lambda";
import { container } from "../../../di/inversify.config";
import { IExpenseService } from "../../../services/expense-service/expense-service-interface";
import { HttpStatusCode, DataResponse, ExpenseMessage, ExpenseMessageType } from "@splitsies/shared-models";
import { SplitsiesFunctionHandlerFactory, ILogger, ExpectedError } from "@splitsies/utils";
import { UnauthorizedUserError } from "src/models/error/unauthorized-user-error";
import { IExpenseBroadcaster } from "@libs/expense-broadcaster/expense-broadcaster-interface";
import { InvalidStateError } from "src/models/error/invalid-state-error";
import { ApiCommunicationError } from "src/models/error/api-communication-error";

const logger = container.get<ILogger>(ILogger);
const expenseService = container.get<IExpenseService>(IExpenseService);
const expenseBroadcaster = container.get<IExpenseBroadcaster>(IExpenseBroadcaster);

export const main = middyfy(
    SplitsiesFunctionHandlerFactory.create<typeof schema, void | string>(
        logger,
        async (event) => {
            const expenseId = event.pathParameters.expenseId;
            const userId = event.requestContext.authorizer.userId;

            await expenseService.addToExpenseGroup(expenseId, userId, event.body.expense);

            const expense = await expenseService.getLeadingExpense(expenseId);
            
            await expenseBroadcaster.broadcast(new ExpenseMessage({
                type: ExpenseMessageType.ExpenseDto,
                connectedExpenseId: expense.id,
                expenseDto: expense,
            }));
            
            return new DataResponse(HttpStatusCode.OK, null).toJson();
        },
        [
            new ExpectedError(UnauthorizedUserError, HttpStatusCode.UNAUTHORIZED, "User cannot modify this expense"),
            new ExpectedError(InvalidStateError, HttpStatusCode.BAD_REQUEST, "Unable to add a child to a non-existent expense"),
            new ExpectedError(ApiCommunicationError, HttpStatusCode.BAD_GATEWAY, "Communication error"),
        ],
    ),
);
