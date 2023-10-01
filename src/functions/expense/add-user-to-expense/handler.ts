import schema from "./schema";
import { middyfy } from "../../../libs/lambda";
import { container } from "../../../di/inversify.config";
import { IExpenseService } from "../../../services/expense-service/expense-service-interface";
import { HttpStatusCode, DataResponse } from "@splitsies/shared-models";
import { SplitsiesFunctionHandlerFactory, ILogger, ExpectedError } from "@splitsies/utils";
import { IUserExpense } from "src/models/user-expense/user-expense-interface";
import { UnauthorizedUserError } from "src/models/error/unauthorized-user-error";

const logger = container.get<ILogger>(ILogger);
const expenseService = container.get<IExpenseService>(IExpenseService);

export const main = middyfy(
    SplitsiesFunctionHandlerFactory.create<typeof schema, void | string>(logger, async (event) => {
        const expenseId = event.pathParameters.expenseId;
        const userId = event.body.userId;
        const newUserExpense = { expenseId, userId } as IUserExpense;
        const result = await expenseService.addUserToExpense(newUserExpense, event.requestContext.authorizer.userId);
        return new DataResponse(HttpStatusCode.OK, result).toJson();
    }, [new ExpectedError(UnauthorizedUserError, HttpStatusCode.UNAUTHORIZED, "User cannot modify this expense")]),
);
