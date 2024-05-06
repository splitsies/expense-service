import "reflect-metadata";
import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { DynamoDBStreamHandler } from "aws-lambda";
import { container } from "src/di/inversify.config";
import { IExpenseBroadcaster } from "@libs/expense-broadcaster/expense-broadcaster-interface";
import { IQueueMessage } from "@splitsies/shared-models";
import { IExpensePublishRequest } from "src/models/expense-publish-request/expense-publish-request-interface";
import { IMessageQueueClient } from "@splitsies/utils";

const expenseBroadcaster = container.get<IExpenseBroadcaster>(IExpenseBroadcaster);
const messageQueueClient = container.get<IMessageQueueClient>(IMessageQueueClient);

export const main: DynamoDBStreamHandler = async (event, _, callback) => {
    const promises: Promise<void>[] = [];
    const updates: IQueueMessage<IExpensePublishRequest>[] = [];

    for (const record of event.Records) {
        if (!record.dynamodb?.NewImage) continue;

        const update = unmarshall(
            record.dynamodb.NewImage as Record<string, AttributeValue>,
        ) as IQueueMessage<IExpensePublishRequest>;
        updates.push(update);

        if (Date.now() > update.ttl) continue;
        promises.push(expenseBroadcaster.notify(update.data.expenseDto, update.data.connection));
    }

    promises.push(messageQueueClient.deleteBatch(updates));
    await Promise.all(promises);

    callback(null);
};
