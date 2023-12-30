import schema from "./schema";
import { middyfy } from "../../../libs/lambda";
import { container } from "../../../di/inversify.config";
import { IExpenseService } from "../../../services/expense-service/expense-service-interface";
import { HttpStatusCode, DataResponse, IExpenseUserDetails, ExpenseMessage } from "@splitsies/shared-models";
import { SplitsiesFunctionHandlerFactory, ILogger, IExpectedError } from "@splitsies/utils";
import { IExpenseBroadcaster } from "@libs/expense-broadcaster/expense-broadcaster-interface";

const logger = container.get<ILogger>(ILogger);
const expenseService = container.get<IExpenseService>(IExpenseService);
const expenseBroadcaster = container.get<IExpenseBroadcaster>(IExpenseBroadcaster);

const expectedErrors: IExpectedError[] = [];

export const main = middyfy(
    SplitsiesFunctionHandlerFactory.create<typeof schema, void | string>(
        logger,
        async (event) => {
            const guestId = decodeURIComponent(event.pathParameters.guestId);
            const registeredUser = event.body.registeredUser as IExpenseUserDetails;
            const payloads = await expenseService.replaceGuestUserInfo(guestId, registeredUser);

            for (const payload of payloads) {
                expenseBroadcaster.broadcast(payload.expense.id, new ExpenseMessage("payload", payload));
            }

            return new DataResponse(HttpStatusCode.OK, null).toJson();
        },
        expectedErrors,
    ),
);
