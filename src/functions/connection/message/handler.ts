import "reflect-metadata";
import schema from "./schema";
import { ExpectedError, ILogger, SplitsiesFunctionHandlerFactory } from "@splitsies/utils";
import { container } from "src/di/inversify.config";
import {
    DataResponse,
    ExpenseUserDetails,
    HttpStatusCode,
    IExpense,
    IExpenseMapper,
    IExpenseUpdate,
    IExpenseUserDetails,
    InvalidArgumentsError,
} from "@splitsies/shared-models";
import { IConnectionService } from "src/services/connection-service/connection-service-interface";
import { middyfyWs } from "@libs/lambda";
import { IExpenseService } from "src/services/expense-service/expense-service-interface";
import { sendMessage } from "@libs/broadcast";
import { IConnectionConfiguration } from "src/models/configuration/connection/connection-configuration-interface";
import { MismatchedExpenseError } from "src/models/error/mismatched-expense-error";
import { MethodNotSupportedError } from "src/models/error/method-not-supported-error";

const logger = container.get<ILogger>(ILogger);
const connectionService = container.get<IConnectionService>(IConnectionService);
const expenseService = container.get<IExpenseService>(IExpenseService);
const connectionConfiguration = container.get<IConnectionConfiguration>(IConnectionConfiguration);
const expenseMapper = container.get<IExpenseMapper>(IExpenseMapper);

const expectedErrors = [
    new ExpectedError(MismatchedExpenseError, HttpStatusCode.FORBIDDEN, "Cannot update this expense in this session"),
    new ExpectedError(MethodNotSupportedError, HttpStatusCode.BAD_REQUEST, "Unknown method"),
    new ExpectedError(InvalidArgumentsError, HttpStatusCode.BAD_REQUEST, "Missing payload"),
];

export const main = middyfyWs(
    SplitsiesFunctionHandlerFactory.create<typeof schema, any>(
        logger,
        async (event) => {
            await connectionService.refreshTtl(event.requestContext.connectionId);

            let updated: IExpense = undefined;

            switch (event.body.method) {
                case "update":
                    if (!event.body.expense) throw new InvalidArgumentsError();
                    updated = await update(event.body.id, event.body.expense as IExpenseUpdate);
                    break;
                case "addItem":
                    if (!event.body.item) throw new InvalidArgumentsError();
                    const { name, price, owners, isProportional } = event.body.item;

                    updated = await add(
                        event.body.id,
                        name,
                        price,
                        owners.map(
                            (o) =>
                                new ExpenseUserDetails(
                                    o.isRegistered,
                                    o.id,
                                    o.givenName,
                                    o.familyName ?? "",
                                    o.phoneNumber ?? "",
                                ),
                        ),
                        isProportional,
                    );
                    break;
                default:
                    throw new MethodNotSupportedError();
            }

            const relatedConnectionIds = await connectionService.getRelatedConnections(
                event.requestContext.connectionId,
            );

            await Promise.all(
                relatedConnectionIds.map((id) =>
                    sendMessage(connectionConfiguration.gatewayUrl, id, expenseMapper.toDtoModel(updated)),
                ),
            );
            return new DataResponse(HttpStatusCode.OK, updated).toJson();
        },
        expectedErrors,
    ),
);

const update = (id: string, update: IExpenseUpdate): Promise<IExpense> => {
    return expenseService.updateExpense(id, update);
};

const add = (
    id: string,
    name: string,
    price: number,
    owners: IExpenseUserDetails[],
    isProportional: boolean,
): Promise<IExpense> => {
    return expenseService.addItemToExpense(name, price, owners, isProportional, id);
};
