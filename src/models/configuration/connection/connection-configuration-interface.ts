export interface IConnectionConfiguration {
    readonly ttlMs: number;
}

export const IConnectionConfiguration = Symbol.for("IConnectionConfiguration");
