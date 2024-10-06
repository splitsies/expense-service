import { injectable } from "inversify";
import { IConnectionConfiguration } from "./connection-configuration-interface";
import assert from "assert";

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
        const connectionGateways = process.env.connectionGateways.split(",");
        for (const key of connectionGateways) {
            const parts = key.split("#");
            const gatewayUrl = `https://${parts[0]}.execute-api.${parts[1]}.amazonaws.com/${parts[2]}/`;
            const topic = `arn:aws:sns:${parts[1]}:${parts[3]}:CrossGatewayExpenseMessage`;

            console.log({ gatewayUrl, topic });
            this.apigData.push([gatewayUrl, topic]);
        }
    }
}
