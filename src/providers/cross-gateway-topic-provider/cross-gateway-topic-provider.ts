import { inject, injectable } from "inversify";
import { ICrossGatewayTopicProvider } from "./cross-gateway-topic-provider.i";
import { IConnectionConfiguration } from "../../models/configuration/connection/connection-configuration-interface";
import { NotFoundError } from "@splitsies/shared-models";

@injectable()
export class CrossStageTopicProvider implements ICrossGatewayTopicProvider {
    private readonly _apigToTopicMap = new Map<string, string>();

    constructor(@inject(IConnectionConfiguration) _connectionConfiguration: IConnectionConfiguration) {
        for (const [gatewayUrl, topicArn] of _connectionConfiguration.apigData) {
            this._apigToTopicMap.set(gatewayUrl, topicArn);
        }
    }

    provide(gatewayUrl: string): string {
        const topic = this._apigToTopicMap.get(gatewayUrl);
        if (!topic) {
            throw new NotFoundError(`Could not find a topic route for gateway ${gatewayUrl}`);
        }

        return topic;
    }
}
