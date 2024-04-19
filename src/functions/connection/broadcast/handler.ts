import "reflect-metadata";
import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { container } from "src/di/inversify.config";
import { IExpenseBroadcaster } from "@libs/expense-broadcaster/expense-broadcaster-interface";
import { IExpenseService } from "src/services/expense-service/expense-service-interface";
import { IExpenseDto, IQueueMessage } from "@splitsies/shared-models";
import { middyfyConnection } from "@libs/lambda";
import { DynamoDBStreamEvent } from "aws-lambda/trigger/dynamodb-stream";
import { Callback, Context } from "aws-lambda/handler";

const expenseBroadcaster = container.get<IExpenseBroadcaster>(IExpenseBroadcaster);
const expenseService = container.get<IExpenseService>(IExpenseService);

export const main = middyfyConnection(async (event: DynamoDBStreamEvent, _: Context, callback: Callback<any>) => {
    const promises: Promise<void>[] = [];
    const updates: IQueueMessage<IExpenseDto>[] = [];
    const cache = new Map<string, IQueueMessage<IExpenseDto>>();

    for (const record of event.Records) {
        if (!record.dynamodb?.NewImage) continue;

        const update = unmarshall(
            record.dynamodb.NewImage as Record<string, AttributeValue>,
        ) as IQueueMessage<IExpenseDto>;
        updates.push(update);

        if (Date.now() > update.ttl) continue;
        const cached = cache.get(update.data.id);
        cache.set(update.data.id, cached && cached.timestamp > update.timestamp ? cached : update);
    }

    promises.push(expenseService.deleteExpenseUpdates(updates));
    for (const [_, update] of cache) {
        promises.push(expenseBroadcaster.notify(update.data));
    }

    Promise.all(promises).then(() => callback(null));
});
