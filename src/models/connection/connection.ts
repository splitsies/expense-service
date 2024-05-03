import { IConnection } from "./connection-interface";

export class Connection implements IConnection {
    constructor(
        readonly connectionId: string,
        readonly expenseId: string,
        readonly ttl: number,
        readonly gatewayUrl: string,
    ) {}
}
