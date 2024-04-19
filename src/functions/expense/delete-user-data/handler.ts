import { container } from "../../../di/inversify.config";
import { IExpenseService } from "../../../services/expense-service/expense-service-interface";
import { IQueueMessage } from "@splitsies/shared-models";
import { IExpenseBroadcaster } from "@libs/expense-broadcaster/expense-broadcaster-interface";
import { DynamoDBStreamEvent } from "aws-lambda/trigger/dynamodb-stream";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { IMessageQueueClient } from "@splitsies/utils";
import { middyfyConnection } from "@libs/lambda";
import { Callback, Context } from "aws-lambda/handler";

const expenseService = container.get<IExpenseService>(IExpenseService);
const expenseBroadcaster = container.get<IExpenseBroadcaster>(IExpenseBroadcaster);
const messageQueueClient = container.get<IMessageQueueClient>(IMessageQueueClient);


export const main = middyfyConnection((event: DynamoDBStreamEvent, _: Context, callback: Callback<any>) => {
    const start = Date.now();
    const handler = async () => {
        const messages: IQueueMessage<string>[] = [];
        const expenseIds = [];

        console.log(JSON.stringify(event, null, 2));

        for (const record of event.Records) {
            if (!record.dynamodb.NewImage) continue;

            const message = unmarshall(record.dynamodb.NewImage as Record<string, AttributeValue>) as IQueueMessage<string>;
            console.log({ record });
            messages.push(message);
            expenseIds.push( ...(await expenseService.deleteUserData(message.data)));
        }

        console.log("all updates complete");
        console.log({ expenseIds });

        for (const id of expenseIds) {
            const expense = await expenseService.getExpense(id);
            console.log({ expense });

            await expenseBroadcaster.broadcast(expense);
            console.log(`broadcasted ${id}`);
        }

        await messageQueueClient.deleteBatch(messages);
    };

    handler().then(_ => {
        console.log("success");
        console.log(`time: ${Date.now() - start}`);
        callback(null, null);
    });

});
