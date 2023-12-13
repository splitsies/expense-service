import schema from "./schema";
import { middyfy } from "../../../libs/lambda";
import { container } from "../../../di/inversify.config";
import { IExpenseService } from "../../../services/expense-service/expense-service-interface";
import {
    HttpStatusCode,
    DataResponse,
    InvalidArgumentsError,
    IExpenseJoinRequest,
} from "@splitsies/shared-models";
import { SplitsiesFunctionHandlerFactory, ILogger, ExpectedError, IExpectedError } from "@splitsies/utils";
import { UnauthorizedUserError } from "src/models/error/unauthorized-user-error";

const logger = container.get<ILogger>(ILogger);
const expenseService = container.get<IExpenseService>(IExpenseService);

const expectedErrors: IExpectedError[] = [
    new ExpectedError(InvalidArgumentsError, HttpStatusCode.BAD_REQUEST, "userId not supplied"),
    new ExpectedError(UnauthorizedUserError, HttpStatusCode.UNAUTHORIZED, "supplied token is not valid for this user"),
];

export const main = middyfy(
    SplitsiesFunctionHandlerFactory.create<typeof schema, IExpenseJoinRequest[] | string>(
        logger,
        async (event) => {
            const expenseId = event.pathParameters.expenseId;

            if (!(
                await expenseService.getUserExpense(event.requestContext.authorizer.userId, expenseId))) {
                throw new UnauthorizedUserError();
            }

            const result = await expenseService.getJoinRequestsForExpense(expenseId);
            logger.log({ result });
            return new DataResponse(HttpStatusCode.OK, result).toJson();
        },
        expectedErrors,
    ),
);
