import schema from "./schema";
import { middyfy } from "../../../libs/lambda";
import { container } from "../../../di/inversify.config";
import { IExpenseService } from "../../../services/expense-service/expense-service-interface";
import {
    HttpStatusCode,
    DataResponse,
    InvalidArgumentsError,
    IExpenseDto,
    IScanResult,
} from "@splitsies/shared-models";
import {
    SplitsiesFunctionHandlerFactory,
    ILogger,
    ExpectedError,
    IExpectedError,
    IPageInfoMapper,
} from "@splitsies/utils";
import { UnauthorizedUserError } from "src/models/error/unauthorized-user-error";

const logger = container.get<ILogger>(ILogger);
const expenseService = container.get<IExpenseService>(IExpenseService);
const pageInfoMapper = container.get<IPageInfoMapper>(IPageInfoMapper);

const expectedErrors: IExpectedError[] = [
    new ExpectedError(InvalidArgumentsError, HttpStatusCode.BAD_REQUEST, "userId not supplied"),
    new ExpectedError(UnauthorizedUserError, HttpStatusCode.UNAUTHORIZED, "supplied token is not valid for this user"),
];

export const main = middyfy(
    SplitsiesFunctionHandlerFactory.create<typeof schema, IScanResult<IExpenseDto> | string>(
        logger,
        async (event) => {
            if (!event.queryStringParameters.userId) {
                throw new InvalidArgumentsError();
            }

            if (event.queryStringParameters.userId !== event.requestContext.authorizer.userId) {
                throw new UnauthorizedUserError();
            }
            const pagination = pageInfoMapper.fromUri(event.queryStringParameters.pagination);
            const userId = event.queryStringParameters.userId;
            const expenses = await expenseService.getExpensesForUser(userId, pagination.limit, pagination.offset);
            return new DataResponse(HttpStatusCode.OK, expenses).toJson();
        },
        expectedErrors,
    ),
);
