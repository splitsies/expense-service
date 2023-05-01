import schema from "./schema";
import { middyfy } from "../../../libs/lambda";
import { container } from "../../../di/inversify.config";
import { IExpenseService } from "../../../services/expense-service-interface";
import { HttpStatusCode, IExpense, DataResponse } from "@splitsies/shared-models";
import { SplitsiesFunctionHandlerFactory, ILogger } from "@splitsies/utils";
import { NotFoundError } from "src/models/error/not-found-error";
import { IExpenseUpdate } from "src/models/expense-update/expense-update-interface";

const logger = container.get<ILogger>(ILogger);
const expenseService = container.get<IExpenseService>(IExpenseService);

export const main = middyfy(
    SplitsiesFunctionHandlerFactory.create<typeof schema, IExpense | string>(logger, async (event) => {
        const { id, expense } = event.body;

        try {
            const result = await expenseService.updateExpense(id, expense as IExpenseUpdate);
            return new DataResponse(HttpStatusCode.OK, result).toJson();
        } catch (e) {
            if (e instanceof NotFoundError) {
                return new DataResponse(HttpStatusCode.NOT_FOUND, e.message).toJson();
            }

            throw e;
        }
    }),
);
