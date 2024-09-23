import { container } from "../../../di/inversify.config";
import { IExpenseService } from "../../../services/expense-service/expense-service-interface";
import { ExpenseMessage, ExpenseMessageType, IQueueMessage } from "@splitsies/shared-models";
import { IExpenseBroadcaster } from "@libs/expense-broadcaster/expense-broadcaster-interface";
import { IMessageQueueClient } from "@splitsies/utils";
import { SQSHandler } from "aws-lambda";

const expenseService = container.get<IExpenseService>(IExpenseService);
const expenseBroadcaster = container.get<IExpenseBroadcaster>(IExpenseBroadcaster);
const messageQueueClient = container.get<IMessageQueueClient>(IMessageQueueClient);
const queueUrl = `https://sqs.${process.env.RtRegion}.amazonaws.com/${process.env.AwsAccountId}/Splitsies-UserAccountModifiedQueue-${process.env.Stage}`;

export const main: SQSHandler = async (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;

    const messages: IQueueMessage<string>[] = [];
    const expenseIds = [];

    for (const record of event.Records) {
        if (!record.body) continue;

        console.log({ record });
        
        const message = JSON.parse(body) as IQueueMessage<string>;
        // expenseIds.push(...(await expenseService.deleteUserData(message.data)));
        messages.push(messageQueueClient.createDeleteRecord(queueUrl, record.messageId, record.receiptHandle));
    }

    await messageQueueClient.deleteBatch(messages);
    callback(null, null);
};
