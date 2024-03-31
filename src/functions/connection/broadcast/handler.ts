import "reflect-metadata";
import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { ExpenseDto } from "@splitsies/shared-models";
import { DynamoDBStreamHandler } from "aws-lambda";
import { IExpenseUpdate } from "src/models/expense-update/expense-update-interface";
import { container } from "src/di/inversify.config";
import { IExpenseBroadcaster } from "@libs/expense-broadcaster/expense-broadcaster-interface";
import { IExpenseService } from "src/services/expense-service/expense-service-interface";
import { IExpenseDtoMapper } from "src/mappers/expense-dto-mapper.ts/expense-dto-mapper-interface";

const expenseBroadcaster = container.get<IExpenseBroadcaster>(IExpenseBroadcaster);
const expenseService = container.get<IExpenseService>(IExpenseService);
const dtoMapper = container.get<IExpenseDtoMapper>(IExpenseDtoMapper);

export const main: DynamoDBStreamHandler = (event, context, callback) => {
    const broadcasts: Promise<void>[] = [];
    const deletes: Promise<void>[] = [];
    const cache = new Map<string, IExpenseUpdate>();
    

    for (const record of event.Records) {
        console.log({ eventName: record.eventName });
        if (!record.dynamodb?.NewImage) continue;
        console.log(record.dynamodb.NewImage);

        const update = unmarshall({ ...record.dynamodb.NewImage } as Record<string, AttributeValue>) as IExpenseUpdate;
        deletes.push(expenseService.deleteExpenseUpdate(update));

        if (Date.now() > update.ttl) continue;
        const cached = cache.get(update.id);
        cache.set(update.id, (cached && cached.timestamp > update.timestamp) ? cached : update);
    }

    for (const [_, update] of cache) {
        broadcasts.push(expenseBroadcaster.notify(dtoMapper.fromUpdate(update)));
    }

    Promise.all([...broadcasts, ...deletes]).then(() => callback(null));
};
