import { injectable } from "inversify";
import { IConnectionConfiguration } from "./connection-configuration-interface";
import assert from "assert";

@injectable()
export class ConnectionConfiguration implements IConnectionConfiguration {
    readonly ttlMs: number;
    
    constructor() {
        assert(!!process.env.connectionTtlSec, "TTL was undefined");
        this.ttlMs = parseInt(process.env.connectionTtlSec) * 1000;
    }
}
