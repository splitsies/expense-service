import { handlerPath } from "../../../libs/handler-resolver";

export default {
    handler: `${handlerPath(__dirname)}/handler.main`,
    events: [
        {
            stream: {
                type: "dynamodb",
                arn: "${param:EXPENSE_UPDATE_STREAM_ARN}",
                startingPosition: "LATEST",
                filterPatterns: [
                    { eventName: ["INSERT"] }
                ],
            }
        },
    ]
};
