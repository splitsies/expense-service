import { inject, injectable } from "inversify";
import { IConnection } from "src/models/connection/connection-interface";
import { IConnectionService } from "./connection-service-interface";
import { IConnectionEngine } from "src/engines/connection-engine/connection-engine-interface";
import { IExpenseService } from "../expense-service-interface";
import { NotFoundError } from "src/models/error/not-found-error";

@injectable()
export class ConnectionService implements IConnectionService {
    constructor(
        @inject(IExpenseService) private readonly _expenseService: IExpenseService,
        @inject(IConnectionEngine) private readonly _connectionEngine: IConnectionEngine,
    ) {}

    async create(id: string, expenseId: string): Promise<IConnection> {
        if (!(await this._expenseService.getExpense(expenseId))) {
            throw new NotFoundError(`Could create a connection for expense id=${expenseId}`);
        }
        return await this._connectionEngine.createConnection(id, expenseId);
    }

    async refreshTtl(id: string): Promise<IConnection> {
        return await this._connectionEngine.refreshTtl(id);
    }

    async delete(id: string): Promise<void> {
        return await this._connectionEngine.deleteConnection(id);
    }

    async getRelatedConnections(connectionId: string): Promise<string[]> {
        return await this._connectionEngine.getRelatedConnections(connectionId);
    }

    async getExpenseIdForConnection(connectionId: string): Promise<string> {
        return await this._connectionEngine.getExpenseIdForConnection(connectionId);
    }
}
