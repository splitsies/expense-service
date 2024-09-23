
import { handlerPath } from "../../../libs/handler-resolver";
// import { QueueConfig } from "src/config/queue.config";

export default {
    handler: `${handlerPath(__dirname)}/handler.main`,
    // events: [
    //     {
    //         sqs: {
    //             arn: "arn:aws:sqs:${aws:region}:${aws:accountId}:Splitsies-GlobalMessageQueue-${sls:stage}",
    //             filterPatterns: [
    //                 { data: { messageId: { S: [QueueConfig.userDeleted] } } }
    //             ]
    //         }
    //     },
    // ],
};
