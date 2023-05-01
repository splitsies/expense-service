import { injectable } from "inversify";
import { IConnectionConfiguration } from "./connection-configuration-interface";
import assert from "assert";

@injectable()
export class ConnectionConfiguration implements IConnectionConfiguration {
    readonly ttlMs: number;
    readonly deleteExpiredIntervalMin: number;
    readonly gatewayUrl: string;

    constructor() {
        assert(!!process.env.connectionTtlSec, "TTL was undefined");
        assert(!!process.env.deleteExpiredIntervalMin, "DELETE_EXPIRED_INTERVAL_MIN was undefined");
        assert(!!process.env.gatewayUrl, "APIG_URL was undefined");

        this.ttlMs = parseInt(process.env.connectionTtlSec) * 1000;
        this.deleteExpiredIntervalMin = parseInt(process.env.deleteExpiredIntervalMin);
        this.gatewayUrl = process.env.gatewayUrl;
    }
}
