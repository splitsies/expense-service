import "reflect-metadata";
import schema from "./schema";
import { ExpectedError, ILogger, SplitsiesFunctionHandlerFactory } from "@splitsies/utils";
import { container } from "src/di/inversify.config";
import {
    DataResponse,
    ExpenseOperation,
    HttpStatusCode,
    IExpenseMessageParametersMapper,
    InvalidArgumentsError,
} from "@splitsies/shared-models";
import { IConnectionService } from "src/services/connection-service/connection-service-interface";
import { middyfyWs } from "@libs/lambda";
import { MismatchedExpenseError } from "src/models/error/mismatched-expense-error";
import { MethodNotSupportedError } from "src/models/error/method-not-supported-error";
import { IExpenseMessageStrategy } from "src/strategies/expense-message-strategy/expense-message-strategy-interface";
import { IExpenseBroadcaster } from "@libs/expense-broadcaster/expense-broadcaster-interface";
import { IExpenseMessageParametersDto } from "@splitsies/shared-models/lib/src/expense/expense-message-parameters-dto/expense-message-parameters-dto-interface";

const logger = container.get<ILogger>(ILogger);
const connectionService = container.get<IConnectionService>(IConnectionService);
const expenseMessageStrategy = container.get<IExpenseMessageStrategy>(IExpenseMessageStrategy);
const expenseBroadcaster = container.get<IExpenseBroadcaster>(IExpenseBroadcaster);
const expenseMessageParametersMapper = container.get<IExpenseMessageParametersMapper>(IExpenseMessageParametersMapper);

const expectedErrors = [
    new ExpectedError(MismatchedExpenseError, HttpStatusCode.FORBIDDEN, "Cannot update this expense in this session"),
    new ExpectedError(MethodNotSupportedError, HttpStatusCode.BAD_REQUEST, "Unknown method"),
    new ExpectedError(InvalidArgumentsError, HttpStatusCode.BAD_REQUEST, "Missing payload"),
];
export const main = middyfyWs(
    SplitsiesFunctionHandlerFactory.create<typeof schema, any>(
        logger,
        async (event) => {
            if (event.body.method === "ping") {
                return new DataResponse(HttpStatusCode.OK, null).toJson();
            }

            const paramsDto = event.body.params as IExpenseMessageParametersDto;
            const params = expenseMessageParametersMapper.toDomainModel(paramsDto);

            const updated = await expenseMessageStrategy.execute(event.body.method as ExpenseOperation, params);
            await connectionService.refreshTtl(event.requestContext.connectionId);
            
            const ignored = [];
            if (params.ignoreResponse) {
                console.log(`ignoring connection=${event.requestContext.connectionId}`);
                ignored.push(event.requestContext.connectionId);
            }

            await expenseBroadcaster.broadcast(updated, ignored);
            return new DataResponse(HttpStatusCode.OK, updated).toJson();
        },
        expectedErrors,
    ),
);
