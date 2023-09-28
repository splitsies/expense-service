import schema from "./schema";
import { middyfy } from "../../../libs/lambda";
import { container } from "../../../di/inversify.config";
import { IExpenseService } from "../../../services/expense-service/expense-service-interface";
import { HttpStatusCode, IExpense, DataResponse, NotFoundError } from "@splitsies/shared-models";
import { SplitsiesFunctionHandlerFactory, ILogger } from "@splitsies/utils";
import { ImageProcessingError } from "src/models/error/image-processing-error";

const logger = container.get<ILogger>(ILogger);
const expenseService = container.get<IExpenseService>(IExpenseService);

export const main = middyfy(
    SplitsiesFunctionHandlerFactory.create<typeof schema, IExpense>(logger, async (event) => {
        try {
            const result = !!event.body.image
                ? await expenseService.createExpenseFromImage(event.body.image, event.body.userId)
                : await expenseService.createExpense(event.body.userId);

            return new DataResponse(HttpStatusCode.CREATED, result).toJson();
        } catch (e) {
            if (e instanceof NotFoundError) {
                return new DataResponse(
                    HttpStatusCode.BAD_REQUEST,
                    `Unable to find user ${event.body.userId}`,
                ).toJson();
            } else if (e instanceof ImageProcessingError) {
                return new DataResponse(HttpStatusCode.BAD_REQUEST, e.message).toJson();
            }
            throw e;
        }
    }),
);
