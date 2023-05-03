import schema from "./schema";
import { middyfy } from "../../../libs/lambda";
import { container } from "../../../di/inversify.config";
import { IExpenseService } from "../../../services/expense-service/expense-service-interface";
import { HttpStatusCode, IExpense, DataResponse } from "@splitsies/shared-models";
import { SplitsiesFunctionHandlerFactory, ILogger } from "@splitsies/utils";

const logger = container.get<ILogger>(ILogger);
const expenseService = container.get<IExpenseService>(IExpenseService);

export const main = middyfy(
    SplitsiesFunctionHandlerFactory.create<typeof schema, IExpense>(logger, async (_event) => {
        const result = await expenseService.createExpense();
        return new DataResponse(HttpStatusCode.CREATED, result).toJson();
    }),
);
