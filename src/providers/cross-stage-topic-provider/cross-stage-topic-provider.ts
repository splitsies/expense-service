import { inject, injectable } from "inversify";
import { ICrossStageTopicProvider } from "./cross-stage-topic-provider.i";
import { IConnectionConfiguration } from "src/models/configuration/connection/connection-configuration-interface";
import { NotFoundError } from "@splitsies/shared-models";

@injectable()
export class CrossStageTopicProvider implements ICrossStageTopicProvider {

    private readonly _apigToTopicMap = new Map<string, string>();

    constructor(@inject(IConnectionConfiguration) _connectionConfiguration: IConnectionConfiguration) {
        for (const [gatewayUrl, topicArn] of _connectionConfiguration.apigData) {
            this._apigToTopicMap.set(gatewayUrl, topicArn);
        }
    }

    provide(gatewayUrl: string): string {
        if (!this._apigToTopicMap.has(gatewayUrl)) {
            throw new NotFoundError(`Could not find a topic route for gateway ${gatewayUrl}`);
        }
        
        return this._apigToTopicMap.get(gatewayUrl);
    }
}