export interface IConnection {
    readonly connectionId: string;
    readonly expenseId: string;
    readonly ttl: number;
    readonly gatewayUrl: string;
}

export type Key = Pick<IConnection, "connectionId" | "expenseId">;
