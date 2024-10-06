import { inject, injectable } from "inversify";
import { ISnsClientProvider } from "./sns-client-provider.i";
import { SNSClient } from "@aws-sdk/client-sns";
import { IConnectionConfiguration } from "src/models/configuration/connection/connection-configuration-interface";

@injectable()
export class SnsClientProvider implements ISnsClientProvider {
    private readonly _regionClients: Map<string, SNSClient>;

    constructor(@inject(IConnectionConfiguration) connectionConfiguration: IConnectionConfiguration) {
        connectionConfiguration.apigData.forEach(([_, topicArn]) => {
            const region = topicArn.split(":")[3];
            this._regionClients.set(region, new SNSClient({ region }));
        });
    }

    provideForArn(topicArn: string): SNSClient {
        const region = topicArn.split(":")[3];
        console.log({ topicArn, region });
        return this._regionClients.get(region);
    }
}