import schema from "./schema";
import { middyfy } from "../../../libs/lambda";
import { container } from "../../../di/inversify.config";
import { IExpenseService } from "../../../services/expense-service/expense-service-interface";
import { HttpStatusCode, DataResponse, ExpenseMessage } from "@splitsies/shared-models";
import { SplitsiesFunctionHandlerFactory, ILogger, ExpectedError, IExpectedError } from "@splitsies/utils";
import { UnauthorizedUserError } from "src/models/error/unauthorized-user-error";
import { IConnectionService } from "src/services/connection-service/connection-service-interface";
import { sendMessage } from "@libs/broadcast";
import { IConnectionConfiguration } from "src/models/configuration/connection/connection-configuration-interface";

const logger = container.get<ILogger>(ILogger);
const expenseService = container.get<IExpenseService>(IExpenseService);
const connectionService = container.get<IConnectionService>(IConnectionService);
const connectionConfig = container.get<IConnectionConfiguration>(IConnectionConfiguration);

const expectedErrors: IExpectedError[] = [
    new ExpectedError(UnauthorizedUserError, HttpStatusCode.FORBIDDEN, "Unauthorized to access this resource"),
];

export const main = middyfy(
    SplitsiesFunctionHandlerFactory.create<typeof schema, void | string>(
        logger,
        async (event) => {
            const tokenUserId = event.requestContext.authorizer.userId;

            if (!(await expenseService.getUserExpense(event.body.requestingUserId, event.body.expenseId))
                || tokenUserId !== event.body.requestingUserId) {
                throw new UnauthorizedUserError();
            }

            console.log(`adding to join requests`);
            await expenseService.addExpenseJoinRequest(event.body.userId, event.body.expenseId, tokenUserId);

            const updatedJoinRequests = await expenseService.getJoinRequestsForExpense(event.body.expenseId);
            const connectionIds = await connectionService.getConnectionsForExpenseId(event.body.expenseId);

            const message = new ExpenseMessage("joinRequests", updatedJoinRequests);
            for (var id of connectionIds) {
                logger.log(`sending message to ${id}`);
                sendMessage(connectionConfig.gatewayUrl, id, message);
            }

            return new DataResponse(HttpStatusCode.OK, null).toJson();
        },
        expectedErrors,
    ),
);
