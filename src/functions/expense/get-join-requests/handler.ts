import schema from "./schema";
import { middyfy } from "../../../libs/lambda";
import { container } from "../../../di/inversify.config";
import { IExpenseService } from "../../../services/expense-service/expense-service-interface";
import { HttpStatusCode, DataResponse, IScanResult } from "@splitsies/shared-models";
import { SplitsiesFunctionHandlerFactory, ILogger, ExpectedError, IExpectedError } from "@splitsies/utils";
import { UnauthorizedUserError } from "src/models/error/unauthorized-user-error";
import { IUserExpenseDto } from "src/models/user-expense-dto/user-expense-dto-interface";

const logger = container.get<ILogger>(ILogger);
const expenseService = container.get<IExpenseService>(IExpenseService);

const expectedErrors: IExpectedError[] = [
    new ExpectedError(UnauthorizedUserError, HttpStatusCode.FORBIDDEN, "Unauthorized to access this resource"),
];

export const main = middyfy(
    SplitsiesFunctionHandlerFactory.create<typeof schema, IScanResult<IUserExpenseDto> | string>(
        logger,
        async (event) => {
            const userId = event.pathParameters.userId;
            const tokenUserId = event.requestContext.authorizer.userId;



            const pagination = event.queryStringParameters.pagination
                ? (JSON.parse(decodeURIComponent(event.queryStringParameters.pagination)) as {
                      limit: number;
                      offset: number;
                  })
                : { limit: 10, offset: 0 };

            if (userId !== tokenUserId) throw new UnauthorizedUserError();

            const result = await expenseService.getExpenseJoinRequestsForUser(userId, pagination.limit, pagination.offset);
            return new DataResponse(HttpStatusCode.OK, result).toJson();
        },
        expectedErrors,
    ),
);
