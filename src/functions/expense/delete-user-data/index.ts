import { handlerPath } from "../../../libs/handler-resolver";

export default {
    handler: `${handlerPath(__dirname)}/handler.main`,
    events: [
        {
            sqs: {
               arn: "arn:aws:sqs:${aws:region}:${aws:accountId}:Splitsies-UserAccountModifiedQueue-${sls:stage}"
            }
        },
    ],
};
