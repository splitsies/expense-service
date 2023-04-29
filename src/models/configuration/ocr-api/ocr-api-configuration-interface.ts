export interface IOcrApiConfiguration {
    readonly uri: string;
}

export const IOcrApiConfiguration = Symbol.for("IOcrApiConfiguration");
