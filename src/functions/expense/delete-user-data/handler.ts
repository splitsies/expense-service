import { container } from "../../../di/inversify.config";
import { IExpenseService } from "../../../services/expense-service/expense-service-interface";
import { ExpenseMessage, ExpenseMessageType, IQueueMessage } from "@splitsies/shared-models";
import { IExpenseBroadcaster } from "@libs/expense-broadcaster/expense-broadcaster-interface";
import { DynamoDBStreamHandler } from "aws-lambda/trigger/dynamodb-stream";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { IMessageQueueClient } from "@splitsies/utils";

const expenseService = container.get<IExpenseService>(IExpenseService);
const expenseBroadcaster = container.get<IExpenseBroadcaster>(IExpenseBroadcaster);
const messageQueueClient = container.get<IMessageQueueClient>(IMessageQueueClient);

export const main: DynamoDBStreamHandler = async (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;

    const messages: IQueueMessage<string>[] = [];
    const expenseIds = [];

    for (const record of event.Records) {
        if (!record.dynamodb.NewImage) continue;

        const message = unmarshall(record.dynamodb.NewImage as Record<string, AttributeValue>) as IQueueMessage<string>;
        messages.push(message);
        expenseIds.push(...(await expenseService.deleteUserData(message.data)));
    }

    for (const id of expenseIds) {
        const expense = await expenseService.getLeadingExpense(id);
        await expenseBroadcaster.broadcast(new ExpenseMessage({
            type: ExpenseMessageType.ExpenseDto,
            connectedExpenseId: expense.id,
            expenseDto: expense,
        }));
    }

    await messageQueueClient.deleteBatch(messages);
    callback(null, null);
};
