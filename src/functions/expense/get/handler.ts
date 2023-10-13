import schema from "./schema";
import { middyfy } from "../../../libs/lambda";
import { container } from "../../../di/inversify.config";
import { IExpenseService } from "../../../services/expense-service/expense-service-interface";
import { HttpStatusCode, DataResponse, IExpenseDto } from "@splitsies/shared-models";
import { SplitsiesFunctionHandlerFactory, ILogger, ExpectedError, IExpectedError, IExpenseMapper } from "@splitsies/utils";
import { UnauthorizedUserError } from "src/models/error/unauthorized-user-error";

const logger = container.get<ILogger>(ILogger);
const expenseService = container.get<IExpenseService>(IExpenseService);
const expenseMapper = container.get<IExpenseMapper>(IExpenseMapper);

const expectedErrors: IExpectedError[] = [
    new ExpectedError(UnauthorizedUserError, HttpStatusCode.FORBIDDEN, "Unauthorized to access this resource"),
];

export const main = middyfy(
    SplitsiesFunctionHandlerFactory.create<typeof schema, IExpenseDto | string>(
        logger,
        async (event) => {
            const expenseId = event.pathParameters.expenseId;
            const userId = event.requestContext.authorizer.userId;

            const result = await expenseService.getUserExpense(userId, expenseId);
            if (!result) {
                throw new UnauthorizedUserError();
            }

            const expense = await expenseService.getExpense(result.expenseId);
            return new DataResponse(HttpStatusCode.OK, expenseMapper.toDtoModel(expense)).toJson();
        },
        expectedErrors,
    ),
);
