import schema from "./schema";
import { middyfy } from "../../../libs/lambda";
import { container } from "../../../di/inversify.config";
import { IExpenseService } from "../../../services/expense-service/expense-service-interface";
import { HttpStatusCode, DataResponse, ExpensePayload, ExpenseMessage, IExpenseMapper } from "@splitsies/shared-models";
import { SplitsiesFunctionHandlerFactory, ILogger, ExpectedError } from "@splitsies/utils";
import { IUserExpense } from "src/models/user-expense/user-expense-interface";
import { UnauthorizedUserError } from "src/models/error/unauthorized-user-error";
import { IConnectionService } from "src/services/connection-service/connection-service-interface";
import { sendMessage } from "@libs/broadcast";
import { IConnectionConfiguration } from "src/models/configuration/connection/connection-configuration-interface";

const logger = container.get<ILogger>(ILogger);
const expenseService = container.get<IExpenseService>(IExpenseService);
const connectionService = container.get<IConnectionService>(IConnectionService);
const connectionConfiguration = container.get<IConnectionConfiguration>(IConnectionConfiguration);
const expenseMapper = container.get<IExpenseMapper>(IExpenseMapper);

export const main = middyfy(
    SplitsiesFunctionHandlerFactory.create<typeof schema, void | string>(
        logger,
        async (event) => {
            const expenseId = event.pathParameters.expenseId;
            const userId = event.body.userId;
            const newUserExpense = { expenseId, userId } as IUserExpense;
            await expenseService.addUserToExpense(newUserExpense, event.requestContext.authorizer.userId);

            const expense = await expenseService.getExpense(expenseId);
            const users = await expenseService.getExpenseUserDetailsForExpense(expenseId);
            const payload = new ExpensePayload(expenseMapper.toDtoModel(expense), users);

            const connectionIds = await connectionService.getConnectionsForExpenseId(expenseId);

            for (const id of connectionIds) {
                sendMessage(connectionConfiguration.gatewayUrl, id, new ExpenseMessage("payload", payload));
            }

            return new DataResponse(HttpStatusCode.OK, null).toJson();
        },
        [new ExpectedError(UnauthorizedUserError, HttpStatusCode.UNAUTHORIZED, "User cannot modify this expense")],
    ),
);
