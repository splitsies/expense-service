import schema from "./schema";
import { middyfy } from "../../../libs/lambda";
import { container } from "../../../di/inversify.config";
import { IExpenseService } from "../../../services/expense-service/expense-service-interface";
import { HttpStatusCode, DataResponse, ExpenseMessage, ExpensePayload, IExpenseMapper } from "@splitsies/shared-models";
import { SplitsiesFunctionHandlerFactory, ILogger, ExpectedError, IExpectedError } from "@splitsies/utils";
import { UnauthorizedUserError } from "src/models/error/unauthorized-user-error";
import { IExpenseBroadcaster } from "@libs/expense-broadcaster/expense-broadcaster-interface";

const logger = container.get<ILogger>(ILogger);
const expenseService = container.get<IExpenseService>(IExpenseService);
const expenseBroadcaster = container.get<IExpenseBroadcaster>(IExpenseBroadcaster);
const expenseMapper = container.get<IExpenseMapper>(IExpenseMapper);

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

            // await Promise.all([
            await expenseService.addExpenseJoinRequest(event.body.userId, event.body.expenseId, tokenUserId);
                // expenseService.addUserToExpense(
                //     { userId: event.body.userId, expenseId: event.body.expenseId, pendingJoin: true },
                //     tokenUserId,
                // ),
            // ]);
            const updatedJoinRequests = await expenseService.getJoinRequestsForExpense(event.body.expenseId);
            const expense = await expenseService.getExpense(event.body.expenseId);
            const result = await expenseService.getExpenseUserDetailsForExpenses([event.body.expenseId]);
            const users = result.get(event.body.expenseId);
            const payload = new ExpensePayload(expenseMapper.toDtoModel(expense), users);

            await Promise.all([
                expenseBroadcaster.broadcast(
                    event.body.expenseId,
                    new ExpenseMessage("joinRequests", updatedJoinRequests),
                ),
                expenseBroadcaster.broadcast(event.body.expenseId, new ExpenseMessage("payload", payload)),
            ]);

            return new DataResponse(HttpStatusCode.OK, null).toJson();
        },
        expectedErrors,
    ),
);
