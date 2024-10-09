import { SNSClient } from "@aws-sdk/client-sns";

export interface ISnsClientProvider {
    provideForArn(topicArn: string): SNSClient;
}
export const ISnsClientProvider = Symbol.for("ISnsClientProvider");