import schema from "./schema";
import { middyfy } from "../../../libs/lambda";
import { container } from "../../../di/inversify.config";
import { IExpenseService } from "../../../services/expense-service/expense-service-interface";
import {
    HttpStatusCode,
    DataResponse,
    InvalidArgumentsError,
    IExpenseDto,
    IExpenseMapper,
    IExpensePayload,
    ExpensePayload,
} from "@splitsies/shared-models";
import { SplitsiesFunctionHandlerFactory, ILogger, ExpectedError, IExpectedError } from "@splitsies/utils";
import { UnauthorizedUserError } from "src/models/error/unauthorized-user-error";

const logger = container.get<ILogger>(ILogger);
const expenseService = container.get<IExpenseService>(IExpenseService);
const expenseMapper = container.get<IExpenseMapper>(IExpenseMapper);

const expectedErrors: IExpectedError[] = [
    new ExpectedError(InvalidArgumentsError, HttpStatusCode.BAD_REQUEST, "userId not supplied"),
    new ExpectedError(UnauthorizedUserError, HttpStatusCode.UNAUTHORIZED, "supplied token is not valid for this user"),
];

export const main = middyfy(
    SplitsiesFunctionHandlerFactory.create<typeof schema, IExpensePayload[] | string>(
        logger,
        async (event) => {
            if (!event.queryStringParameters.userId) {
                throw new InvalidArgumentsError();
            }
            if (event.queryStringParameters.userId !== event.requestContext.authorizer.userId) {
                throw new UnauthorizedUserError();
            }

            const userId = event.queryStringParameters.userId;
            const result = await expenseService.getExpensesForUser(userId);

            const payloads: IExpensePayload[] = [];

            for (const expense of result) {
                const users = await expenseService.getExpenseUserDetailsForExpense(expense.id);
                payloads.push(new ExpensePayload(expenseMapper.toDtoModel(expense), users));
            }

            return new DataResponse(HttpStatusCode.OK, payloads).toJson();
        },
        expectedErrors,
    ),
);
