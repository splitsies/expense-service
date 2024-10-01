import "reflect-metadata";
import { SNSEvent } from "aws-lambda";
import { container } from "src/di/inversify.config";
import { IExpenseBroadcaster } from "@libs/expense-broadcaster/expense-broadcaster-interface";
import { CrossGatewayExpenseMessage } from "src/models/cross-gateway-expense-message";

const expenseBroadcaster = container.get<IExpenseBroadcaster>(IExpenseBroadcaster);

export const main = async (event: SNSEvent) => {
    const notifications = [];
    for (const record of event.Records) {
        console.log({ record });
        const { message, connection } = JSON.parse(record.Sns.Message) as CrossGatewayExpenseMessage;
        console.log({ message, connection });
        notifications.push(expenseBroadcaster.notify(message, connection));
    }

    await Promise.all(notifications);
};
