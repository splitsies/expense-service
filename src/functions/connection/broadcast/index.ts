import { handlerPath } from "../../../libs/handler-resolver";

export default {
    handler: `${handlerPath(__dirname)}/handler.main`,
    events: [
        {
            stream: {
                type: "dynamodb",
                arn: "arn:aws:dynamodb:us-east-1:975049909936:table/Splitsies-ExpenseUpdate-dev-pr/stream/2024-03-30T21:45:35.401",
                batchSize: 10,
                startingPosition: "LATEST",
                filterPatterns: [
                    { eventName: ["INSERT"] }
                ],
            }
        },
    ]
};
