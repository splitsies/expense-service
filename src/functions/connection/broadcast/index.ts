import { handlerPath } from "../../../libs/handler-resolver";

export default {
    handler: `${handlerPath(__dirname)}/handler.main`,
    events: [
        {
            sns: {
                arn: "arn:aws:sns:${aws:region}:${aws:accountId}:CrossGatewayExpenseMessage",
                topicName: "CrossGatewayExpenseMessage",
            },
        },
    ],
};
