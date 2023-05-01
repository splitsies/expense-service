export interface IConnectionConfiguration {
    readonly ttlMs: number;
    readonly deleteExpiredIntervalMin: number;
    readonly gatewayUrl: string;
}

export const IConnectionConfiguration = Symbol.for("IConnectionConfiguration");
