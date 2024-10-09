import { injectable } from "inversify";
import { IConnectionConfiguration } from "./connection-configuration-interface";
import assert from "assert";
import gatewayConfig from "../../../config/gateway.config.json";

@injectable()
export class ConnectionConfiguration implements IConnectionConfiguration {
    readonly ttlMs: number;
    readonly deleteExpiredIntervalMin: number;
    readonly gatewayUrl: string;
    readonly apigData: string[][];

    constructor() {
        assert(!!process.env.connectionTtlSec, "TTL was undefined");
        assert(!!process.env.deleteExpiredIntervalMin, "DELETE_EXPIRED_INTERVAL_MIN was undefined");
        assert(!!process.env.gatewayUrl, "APIG_URL was undefined");

        this.ttlMs = parseInt(process.env.connectionTtlSec, 10) * 1000;
        this.deleteExpiredIntervalMin = parseInt(process.env.deleteExpiredIntervalMin, 10);
        this.gatewayUrl = process.env.gatewayUrl;

        this.apigData = [];
        for (const configuration of gatewayConfig.gateways) {
            const accountId = process.env[`${configuration.stage}AccountId`];
            const gatewayUrl = `https://${configuration.key}.execute-api.${configuration.region}.amazonaws.com/${configuration.stage}/`;
            const topic = `arn:aws:sns:${configuration.region}:${accountId}:CrossGatewayExpenseMessage`;
            this.apigData.push([gatewayUrl, topic]);
        }
    }
}
