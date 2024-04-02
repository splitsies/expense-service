import { container } from "../../../di/inversify.config";
import { IExpenseService } from "../../../services/expense-service/expense-service-interface";
import { IExpenseUserDetails, IQueueMessage } from "@splitsies/shared-models";
import { IExpenseBroadcaster } from "@libs/expense-broadcaster/expense-broadcaster-interface";
import { DynamoDBStreamHandler } from "aws-lambda/trigger/dynamodb-stream";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { IMessageQueueClient } from "@splitsies/utils";

const expenseService = container.get<IExpenseService>(IExpenseService);
const expenseBroadcaster = container.get<IExpenseBroadcaster>(IExpenseBroadcaster);
const messageQueueClient = container.get<IMessageQueueClient>(IMessageQueueClient);

export const main: DynamoDBStreamHandler = async (event, _, callback) => {
    const messages: IQueueMessage<{ deletedGuestId: string; user: IExpenseUserDetails }[]>[] = [];
    const promises: Promise<void>[] = [];

    for (const record of event.Records) {
        if (!record.dynamodb.NewImage) continue;

        const message = unmarshall(record.dynamodb.NewImage as Record<string, AttributeValue>) as IQueueMessage<
            { deletedGuestId: string; user: IExpenseUserDetails }[]
        >;
        messages.push(message);

        for (const payload of message.data) {
            await expenseService.replaceGuestUserInfo(payload.deletedGuestId, payload.user).then((expenses) => {
                for (const expense of expenses) {
                    promises.push(expenseBroadcaster.broadcast(expense));
                }
            });
        }
    }

    Promise.all([...promises, messageQueueClient.deleteBatch(messages)]).then(() => callback(null));
};
