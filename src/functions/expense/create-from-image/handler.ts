import schema from "./schema";
import { middyfy } from "../../../libs/lambda";
import { container } from "../../../di/inversify.config";
import { IExpenseService } from "../../../services/expense-service/expense-service-interface";
import { HttpStatusCode, IExpense, DataResponse } from "@splitsies/shared-models";
import { SplitsiesFunctionHandlerFactory, ILogger } from "@splitsies/utils";
import { ImageProcessingError } from "src/models/error/image-processing-error";

const logger = container.get<ILogger>(ILogger);
const expenseService = container.get<IExpenseService>(IExpenseService);

export const main = middyfy(
    SplitsiesFunctionHandlerFactory.create<typeof schema, IExpense | string>(logger, async (event) => {
        try {
            const result = await expenseService.createExpenseFromImage(event.body.image);
            return new DataResponse(HttpStatusCode.CREATED, result).toJson();
        } catch (e) {
            if (e instanceof ImageProcessingError) {
                return new DataResponse(HttpStatusCode.BAD_REQUEST, e.message).toJson();
            }

            throw e;
        }
    }),
);
