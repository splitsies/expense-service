import schema from "./schema";
import { middyfy } from "../../../libs/lambda";
import { container } from "../../../di/inversify.config";
import { IExpenseService } from "../../../services/expense-service/expense-service-interface";
import { HttpStatusCode, IExpense, DataResponse, NotFoundError } from "@splitsies/shared-models";
import { SplitsiesFunctionHandlerFactory, ILogger, IExpectedError, ExpectedError } from "@splitsies/utils";
import { ImageProcessingError } from "src/models/error/image-processing-error";
import { UnauthorizedUserError } from "src/models/error/unauthorized-user-error";

const logger = container.get<ILogger>(ILogger);
const expenseService = container.get<IExpenseService>(IExpenseService);

const expectedErrors: IExpectedError[] = [
    new ExpectedError(NotFoundError, HttpStatusCode.BAD_REQUEST, `Unable to find user`),
    new ExpectedError(ImageProcessingError, HttpStatusCode.BAD_GATEWAY, "Unable to process image"),
    new ExpectedError(UnauthorizedUserError, HttpStatusCode.UNAUTHORIZED, "Invalid token for user"),
];

export const main = middyfy(
    SplitsiesFunctionHandlerFactory.create<typeof schema, IExpense>(
        logger,
        async (event) => {
            if (event.body.userId !== event.requestContext.authorizer.userId) {
                throw new UnauthorizedUserError();
            }

            const result = !!event.body.image
                ? await expenseService.createExpenseFromImage(event.body.image, event.body.userId)
                : await expenseService.createExpense(event.body.userId);

            return new DataResponse(HttpStatusCode.CREATED, result).toJson();
        },
        expectedErrors,
    ),
);
