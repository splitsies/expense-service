export interface IConnectionConfiguration {
    readonly ttlMs: number;
    readonly deleteExpiredIntervalMin: number;
    readonly gatewayUrl: string;
    readonly apigData: string[][];
}

export const IConnectionConfiguration = Symbol.for("IConnectionConfiguration");
