import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { ExpenseDto, IExpenseDto } from "@splitsies/shared-models";
import { Context, DynamoDBStreamEvent, DynamoDBStreamHandler } from "aws-lambda";
import "reflect-metadata";
import { IExpenseUpdate } from "src/models/expense-update/expense-update-interface";
// import { IConnectionService } from "src/services/connection-service/connection-service-interface";
// import schema from "./schema";
// import { ExpectedError, ILogger, SplitsiesFunctionHandlerFactory } from "@splitsies/utils";
import { container } from "src/di/inversify.config";
// import {
//     DataResponse,
//     ExpenseMessage,
//     ExpenseOperation,
//     HttpStatusCode,
//     IExpenseMessageParametersMapper,
//     InvalidArgumentsError,
// } from "@splitsies/shared-models";
// import { IConnectionService } from "src/services/connection-service/connection-service-interface";
// import { middyfy, middyfyWs } from "@libs/lambda";
// import { MismatchedExpenseError } from "src/models/error/mismatched-expense-error";
// import { MethodNotSupportedError } from "src/models/error/method-not-supported-error";
// import { IExpenseMessageStrategy } from "src/strategies/expense-message-strategy/expense-message-strategy-interface";
import { IExpenseBroadcaster } from "@libs/expense-broadcaster/expense-broadcaster-interface";
// import { IExpenseMessageParametersDto } from "@splitsies/shared-models/lib/src/expense/expense-message-parameters-dto/expense-message-parameters-dto-interface";

// const logger = container.get<ILogger>(ILogger);
// const connectionService = container.get<IConnectionService>(IConnectionService);
// const expenseMessageStrategy = container.get<IExpenseMessageStrategy>(IExpenseMessageStrategy);
const expenseBroadcaster = container.get<IExpenseBroadcaster>(IExpenseBroadcaster);
// const expenseMessageParametersMapper = container.get<IExpenseMessageParametersMapper>(IExpenseMessageParametersMapper);

// const expectedErrors = [
//     new ExpectedError(MismatchedExpenseError, HttpStatusCode.FORBIDDEN, "Cannot update this expense in this session"),
//     new ExpectedError(MethodNotSupportedError, HttpStatusCode.BAD_REQUEST, "Unknown method"),
//     new ExpectedError(InvalidArgumentsError, HttpStatusCode.BAD_REQUEST, "Missing payload"),
// ];


export const main: DynamoDBStreamHandler = (event, context, callback) => {
    const broadcasts: Promise<void>[] = [];
    const deletes: Promise<void>[] = [];
    const cache = new Map<string, IExpenseUpdate>();

    for (const record of event.Records) {
        if (!record.dynamodb?.NewImage) continue;
        console.log(record.dynamodb.NewImage);

        const update = unmarshall({ ...record.dynamodb.NewImage } as Record<string, AttributeValue>) as IExpenseUpdate;

        if (Date.now() > update.ttl) continue;
        const cached = cache.get(update.id);
        cache.set(update.id, (cached && cached.timestamp > update.timestamp) ? cached : update);
    }

    for (const [_, update] of cache) {
        broadcasts.push(expenseBroadcaster.notify(new ExpenseDto(update.id, update.name, update.transactionDate, update.items, update.userIds)));
    }

    Promise.all(broadcasts).then(() => callback(null));
};
