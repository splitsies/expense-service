import { inject, injectable } from "inversify";
import {
    IExpenseDto,
    IExpenseItem,
    IExpenseJoinRequest,
    IExpenseUserDetails,
    IScanResult,
    QueueMessage,
} from "@splitsies/shared-models";
import { IExpenseService } from "./expense-service-interface";
import { ILogger, IMessageQueueClient } from "@splitsies/utils";
import { IExpenseManager } from "src/managers/expense-manager/expense-manager-interface";
import { IUserExpense } from "src/models/user-expense/user-expense-interface";
import { IUserExpenseDto } from "src/models/user-expense-dto/user-expense-dto-interface";
import { QueueConfig } from "src/config/queue.config";
import { randomUUID } from "crypto";
import { IExpensePublishRequest } from "src/models/expense-publish-request/expense-publish-request-interface";
import { ExpensePublishRequest } from "src/models/expense-publish-request/expense-publish-request";
import { IConnection } from "src/models/connection/connection-interface";

@injectable()
export class ExpenseService implements IExpenseService {
    constructor(
        @inject(ILogger) private readonly _logger: ILogger,
        @inject(IExpenseManager) private readonly _expenseManager: IExpenseManager,
        @inject(IMessageQueueClient) private readonly _messageQueueClient: IMessageQueueClient,
    ) {}

    async queueExpenseUpdate(expenseUpdate: IExpenseDto, connections: IConnection[]): Promise<void> {
        const messages = connections.map((connection) =>
            this._messageQueueClient.send(
                new QueueMessage<IExpensePublishRequest>(
                    QueueConfig.expenseUpdate,
                    randomUUID(),
                    new ExpensePublishRequest(expenseUpdate, connection),
                ),
            ),
        );
        
        await Promise.all(messages);
    }

    async getUserExpense(userId: string, expenseId: string): Promise<IUserExpense> {
        return this._expenseManager.getUserExpense(userId, expenseId);
    }

    async getExpense(id: string): Promise<IExpenseDto> {
        return this._expenseManager.getExpense(id);
    }

    async createExpense(userId: string): Promise<IExpenseDto> {
        return await this._expenseManager.createExpense(userId);
    }

    async createExpenseFromScan(expense: IExpenseDto, userId: string): Promise<IExpenseDto> {
        return this._expenseManager.createExpenseFromScan(expense, userId);
    }

    async updateExpense(id: string, updated: IExpenseDto): Promise<IExpenseDto> {
        return await this._expenseManager.updateExpense(id, updated);
    }

    async getExpensesForUser(userId: string, limit: number, offset: number): Promise<IScanResult<IExpenseDto>> {
        return await this._expenseManager.getExpensesForUser(userId, limit, offset);
    }

    async getUsersForExpense(expenseId: string): Promise<string[]> {
        return await this._expenseManager.getUsersForExpense(expenseId);
    }

    async addUserToExpense(userId: string, expenseId: string, requestingUserId: string): Promise<void> {
        await this._expenseManager.addUserToExpense(userId, expenseId, requestingUserId);
    }

    removeUserFromExpense(expenseId: string, userId: string): Promise<IExpenseDto> {
        return this._expenseManager.removeUserFromExpense(expenseId, userId);
    }

    addExpenseItem(
        name: string,
        price: number,
        owners: IExpenseUserDetails[],
        isProportional: boolean,
        expenseId: string,
    ): Promise<IExpenseDto> {
        return this._expenseManager.addExpenseItem(name, price, owners, isProportional, expenseId);
    }

    async removeExpenseItem(itemId: string, expenseId: string): Promise<IExpenseDto> {
        return this._expenseManager.removeExpenseItem(itemId, expenseId);
    }

    async getExpenseItems(expenseId: string): Promise<IExpenseItem[]> {
        return this._expenseManager.getExpenseItems(expenseId);
    }

    async saveUpdatedItems(updatedItems: IExpenseItem[]): Promise<IExpenseItem[]> {
        return this._expenseManager.saveUpdatedItems(updatedItems);
    }

    async getExpenseJoinRequestsForUser(userId: string): Promise<IUserExpenseDto[]> {
        return await this._expenseManager.getExpenseJoinRequestsForUser(userId);
    }

    getJoinRequestsForExpense(expenseId: string): Promise<IExpenseJoinRequest[]> {
        return this._expenseManager.getJoinRequestsForExpense(expenseId);
    }

    async addExpenseJoinRequest(userId: string, expenseId: string, requestingUserId: string): Promise<void> {
        await this._expenseManager.addExpenseJoinRequest(userId, expenseId, requestingUserId);
        if (userId.startsWith("@splitsies-guest")) return;

        const expense = await this._expenseManager.getExpense(expenseId);
        await this._messageQueueClient.create(
            new QueueMessage(QueueConfig.joinRequest, randomUUID(), { userId, expense, requestingUserId }),
        );
    }

    removeExpenseJoinRequest(userId: string, expenseId: string, requestingUserId: string): Promise<void> {
        return this._expenseManager.removeExpenseJoinRequest(userId, expenseId, requestingUserId);
    }

    async replaceGuestUserInfo(guestUserId: string, registeredUser: IExpenseUserDetails): Promise<IExpenseDto[]> {
        return this._expenseManager.replaceGuestUserInfo(guestUserId, registeredUser);
    }

    async deleteUserData(userId: string): Promise<string[]> {
        return await this._expenseManager.deleteUserData(userId);
    }
}
