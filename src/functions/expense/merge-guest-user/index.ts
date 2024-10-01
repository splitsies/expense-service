import { handlerPath } from "../../../libs/handler-resolver";
import { QueueConfig } from "src/config/queue.config";

export default {
    handler: `${handlerPath(__dirname)}/handler.main`,
    events: [
        {
            stream: {
                type: "dynamodb",
                arn: "${param:MESSAGE_QUEUE_ARN}",
                startingPosition: "LATEST",
                maximumRetryAttempts: 3,
                maximumRecordAgeInSeconds: 60,
                filterPatterns: [
                    {
                        eventName: ["INSERT"],
                        dynamodb: {
                            Keys: { queueName: { S: [QueueConfig.guestUserReplaced] } },
                        },
                    },
                ],
            },
        },
    ],
};
