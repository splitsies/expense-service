import schema from "./schema";
import { middyfy } from "../../../libs/lambda";
import { container } from "../../../di/inversify.config";
import { IExpenseService } from "../../../services/expense-service/expense-service-interface";
import { HttpStatusCode, DataResponse, ExpenseMessage, ExpenseMessageType } from "@splitsies/shared-models";
import { SplitsiesFunctionHandlerFactory, ILogger, ExpectedError } from "@splitsies/utils";
import { UnauthorizedUserError } from "src/models/error/unauthorized-user-error";
import { IExpenseBroadcaster } from "@libs/expense-broadcaster/expense-broadcaster-interface";

const logger = container.get<ILogger>(ILogger);
const expenseService = container.get<IExpenseService>(IExpenseService);
const broadcaster = container.get<IExpenseBroadcaster>(IExpenseBroadcaster);

export const main = middyfy(
    SplitsiesFunctionHandlerFactory.create<typeof schema, void | string>(
        logger,
        async (event) => {
            const expenseId = event.pathParameters.expenseId;
            const userId = event.pathParameters.userId;
            const requestingUserId = event.requestContext.authorizer.userId;

            if (!expenseService.getUserExpense(requestingUserId, expenseId)) {
                throw new UnauthorizedUserError();
            }

            await expenseService.removeUserFromExpense(expenseId, userId);
            const expense = await expenseService.getLeadingExpense(expenseId);
            await broadcaster.broadcast(
                new ExpenseMessage({
                    type: ExpenseMessageType.ExpenseDto,
                    connectedExpenseId: expense.id,
                    expenseDto: expense,
                }),
            );

            return new DataResponse(HttpStatusCode.OK, null).toJson();
        },
        [new ExpectedError(UnauthorizedUserError, HttpStatusCode.UNAUTHORIZED, "User cannot modify this expense")],
    ),
);
