import schema from "./schema";
import { middyfy } from "../../../libs/lambda";
import { container } from "../../../di/inversify.config";
import { IExpenseService } from "../../../services/expense-service/expense-service-interface";
import { HttpStatusCode, IExpense, DataResponse } from "@splitsies/shared-models";
import { SplitsiesFunctionHandlerFactory, ILogger } from "@splitsies/utils";

const logger = container.get<ILogger>(ILogger);
const expenseService = container.get<IExpenseService>(IExpenseService);

export const main = middyfy(
    SplitsiesFunctionHandlerFactory.create<typeof schema, IExpense[] | string>(logger, async (event) => {
        const userId = event.queryStringParameters.userId;
        const result = await expenseService.getExpensesForUser(userId);
        return new DataResponse(HttpStatusCode.OK, result).toJson();
    }),
);
