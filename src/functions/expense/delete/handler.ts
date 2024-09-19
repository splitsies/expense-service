import { middyfy } from "../../../libs/lambda";
import { container } from "../../../di/inversify.config";
import { IExpenseService } from "../../../services/expense-service/expense-service-interface";
import { HttpStatusCode, DataResponse, ExpenseMessage, ExpenseMessageType } from "@splitsies/shared-models";
import { SplitsiesFunctionHandlerFactory, ILogger, IExpectedError, ExpectedError } from "@splitsies/utils";
import { UnauthorizedUserError } from "src/models/error/unauthorized-user-error";
import { IExpenseBroadcaster } from "@libs/expense-broadcaster/expense-broadcaster-interface";

const logger = container.get<ILogger>(ILogger);
const expenseService = container.get<IExpenseService>(IExpenseService);
const expenseBroadcaster = container.get<IExpenseBroadcaster>(IExpenseBroadcaster);

const expectedErrors: IExpectedError[] = [
    new ExpectedError(UnauthorizedUserError, HttpStatusCode.UNAUTHORIZED, "Invalid token for user"),
];

export const main = middyfy(
    SplitsiesFunctionHandlerFactory.create<never, void>(
        logger,
        async (event) => {
            // Get the leading expense before it's deleted
            const leadingExpenseId = await expenseService.getLeadingExpenseId(event.pathParameters.expenseId);
            await expenseService.deleteExpense(event.pathParameters.expenseId, event.requestContext.authorizer.userId);

            if (leadingExpenseId !== event.pathParameters.expenseId) {
                await expenseBroadcaster.broadcast(
                    new ExpenseMessage({
                        type: ExpenseMessageType.ExpenseDto,
                        connectedExpenseId: leadingExpenseId,
                        expenseDto: await expenseService.getExpense(leadingExpenseId),
                    }),
                );
            }

            return new DataResponse(HttpStatusCode.OK, null).toJson();
        },
        expectedErrors,
    ),
);
