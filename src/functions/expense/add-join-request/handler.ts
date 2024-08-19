import schema from "./schema";
import { middyfy } from "../../../libs/lambda";
import { container } from "../../../di/inversify.config";
import { IExpenseService } from "../../../services/expense-service/expense-service-interface";
import { HttpStatusCode, DataResponse, ExpenseMessage, ExpenseMessageType } from "@splitsies/shared-models";
import { SplitsiesFunctionHandlerFactory, ILogger, ExpectedError, IExpectedError } from "@splitsies/utils";
import { UnauthorizedUserError } from "src/models/error/unauthorized-user-error";
import { IExpenseBroadcaster } from "@libs/expense-broadcaster/expense-broadcaster-interface";

const logger = container.get<ILogger>(ILogger);
const expenseService = container.get<IExpenseService>(IExpenseService);
const expenseBroadcaster = container.get<IExpenseBroadcaster>(IExpenseBroadcaster);

const expectedErrors: IExpectedError[] = [
    new ExpectedError(UnauthorizedUserError, HttpStatusCode.FORBIDDEN, "Unauthorized to access this resource"),
];

export const main = middyfy(
    SplitsiesFunctionHandlerFactory.create<typeof schema, void | string>(
        logger,
        async (event) => {
            const tokenUserId = event.requestContext.authorizer.userId;
            if (
                !(await expenseService.getUserExpense(event.body.requestingUserId, event.body.expenseId)) ||
                tokenUserId !== event.body.requestingUserId
            ) {
                throw new UnauthorizedUserError();
            }

            await expenseService.addExpenseJoinRequest(event.body.userId, event.body.expenseId, tokenUserId);

            const expense = await expenseService.getLeadingExpense(event.body.expenseId);
            await expenseBroadcaster.broadcast(
                new ExpenseMessage({
                    type: ExpenseMessageType.ExpenseDto,
                    connectedExpenseId: expense.id,
                    expenseDto: expense,
                }),
            );

            return new DataResponse(HttpStatusCode.OK, null).toJson();
        },
        expectedErrors,
    ),
);
