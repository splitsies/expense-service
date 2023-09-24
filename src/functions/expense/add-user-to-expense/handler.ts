import schema from "./schema";
import { middyfy } from "../../../libs/lambda";
import { container } from "../../../di/inversify.config";
import { IExpenseService } from "../../../services/expense-service/expense-service-interface";
import { HttpStatusCode, DataResponse } from "@splitsies/shared-models";
import { SplitsiesFunctionHandlerFactory, ILogger } from "@splitsies/utils";
import { IUserExpense } from "src/models/user-expense/user-expense-interface";

const logger = container.get<ILogger>(ILogger);
const expenseService = container.get<IExpenseService>(IExpenseService);

export const main = middyfy(
    SplitsiesFunctionHandlerFactory.create<typeof schema, void | string>(logger, async (event) => {
        const userExpense = event.body as IUserExpense;
        const result = await expenseService.addUserToExpense(userExpense);
        return new DataResponse(HttpStatusCode.OK, result).toJson();
    }),
);
