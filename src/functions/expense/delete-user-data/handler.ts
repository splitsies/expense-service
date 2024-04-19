import { container } from "../../../di/inversify.config";
import { IExpenseService } from "../../../services/expense-service/expense-service-interface";
import { IQueueMessage } from "@splitsies/shared-models";
import { IExpenseBroadcaster } from "@libs/expense-broadcaster/expense-broadcaster-interface";
import { DynamoDBStreamHandler } from "aws-lambda/trigger/dynamodb-stream";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { IMessageQueueClient } from "@splitsies/utils";

const expenseService = container.get<IExpenseService>(IExpenseService);
const expenseBroadcaster = container.get<IExpenseBroadcaster>(IExpenseBroadcaster);
const messageQueueClient = container.get<IMessageQueueClient>(IMessageQueueClient);

export const main: DynamoDBStreamHandler = async (event, _, callback) => {
    const messages: IQueueMessage<string>[] = [];
    const promises: Promise<string[]>[] = [];

    console.log({ event });

    for (const record of event.Records) {
        if (!record.dynamodb.NewImage) continue;

        const message = unmarshall(record.dynamodb.NewImage as Record<string, AttributeValue>) as IQueueMessage<string>;
        console.log(JSON.stringify(event, null, 2));
        messages.push(message);
        promises.push(expenseService.deleteUserData(message.data));
    }

    const expenseIds = (await Promise.all(promises)).reduce((p, c) => [...c], []);

    for (const id of expenseIds) {
        const expense = await expenseService.getExpense(id);
        expenseBroadcaster.broadcast(expense);
    }

    // await messageQueueClient.deleteBatch(messages);
    callback(null);
};
