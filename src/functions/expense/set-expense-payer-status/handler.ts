import schema from "./schema";
import { middyfy } from "../../../libs/lambda";
import { container } from "../../../di/inversify.config";
import { IExpenseService } from "../../../services/expense-service/expense-service-interface";
import {
    HttpStatusCode,
    DataResponse,
    IExpenseDto,
    ExpenseMessage,
    ExpenseMessageType,
} from "@splitsies/shared-models";
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
    SplitsiesFunctionHandlerFactory.create<typeof schema, IExpenseDto>(
        logger,
        async (event) => {
            const { expenseId, userId } = event.pathParameters;
            const userExpense = await expenseService.getUserExpense(event.requestContext.authorizer.userId, expenseId);

            if (!userExpense) throw new UnauthorizedUserError();
            const result = await expenseService.setExpensePayerStatus(expenseId, userId, event.body.settled);
            await expenseService.getLeadingExpense(expenseId);

            const expense = await expenseService.getLeadingExpense(expenseId);
            await expenseBroadcaster.broadcast(
                new ExpenseMessage({
                    type: ExpenseMessageType.ExpenseDto,
                    connectedExpenseId: expense.id,
                    expenseDto: expense,
                }),
            );

            return new DataResponse(HttpStatusCode.CREATED, result).toJson();
        },
        expectedErrors,
    ),
);
