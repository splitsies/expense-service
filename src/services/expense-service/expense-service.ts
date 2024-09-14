import { inject, injectable } from "inversify";
import {
    ExpenseMessage,
    IExpenseDto,
    IExpenseItem,
    IExpenseJoinRequest,
    IExpenseUserDetails,
    IPayerShare,
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
import { IExpenseOwnershipValidator } from "src/validators/expense-ownership-validator/expense-ownership-validator.i";
import { ILeadingExpenseValidator } from "src/validators/leading-expense-validator/leading-expense-validator.i";

@injectable()
export class ExpenseService implements IExpenseService {
    constructor(
        @inject(ILogger) private readonly _logger: ILogger,
        @inject(IExpenseManager) private readonly _expenseManager: IExpenseManager,
        @inject(IMessageQueueClient) private readonly _messageQueueClient: IMessageQueueClient,
        @inject(IExpenseOwnershipValidator) private readonly _expenseOwnershipValidator: IExpenseOwnershipValidator,
        @inject(ILeadingExpenseValidator) private readonly _leadingExpenseValidator: ILeadingExpenseValidator,
    ) {}

    async queueExpenseUpdate(expenseUpdate: ExpenseMessage, connections: IConnection[]): Promise<void> {
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

    async deleteExpense(id: string, requestingUserId: string): Promise<void> {
        await this._expenseOwnershipValidator.validate(id, requestingUserId);
        return this._expenseManager.deleteExpense(id);
    }

    async addNewExpenseToGroup(
        parentExpenseId: string,
        userId: string,
        childExpense: IExpenseDto | undefined = undefined,
    ): Promise<IExpenseDto> {
        return this._expenseManager.addNewExpenseToGroup(parentExpenseId, userId, childExpense);
    }

    async addExistingExpenseToGroup(
        groupExpenseId: string,
        childExpenseId: string,
        requestingUserId: string,
    ): Promise<void> {
        await this._expenseOwnershipValidator.validate(groupExpenseId, requestingUserId);
        await this._expenseOwnershipValidator.validate(childExpenseId, requestingUserId);

        return this._expenseManager.addExistingExpenseToGroup(groupExpenseId, childExpenseId);
    }

    async removeExpenseFromGroup(
        groupExpenseId: string,
        childExpenseId: string,
        requestingUserId: string,
    ): Promise<void> {
        await this._expenseOwnershipValidator.validate(groupExpenseId, requestingUserId);
        await this._expenseOwnershipValidator.validate(childExpenseId, requestingUserId);

        return this._expenseManager.removeExpenseFromGroup(groupExpenseId, childExpenseId);
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
        await this._expenseOwnershipValidator.validateForUserAdd(expenseId, userId, requestingUserId);
        await this._expenseManager.addUserToExpense(userId, expenseId);
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

    async getExpenseJoinRequestsForUser(
        userId: string,
        limit: number,
        offset: number,
    ): Promise<IScanResult<IUserExpenseDto>> {
        return await this._expenseManager.getExpenseJoinRequestsForUser(userId, limit, offset);
    }

    async getJoinRequestCountForUser(userId: string): Promise<number> {
        return await this._expenseManager.getJoinRequestCountForUser(userId);
    }

    getJoinRequestsForExpense(expenseId: string): Promise<IExpenseJoinRequest[]> {
        return this._expenseManager.getJoinRequestsForExpense(expenseId);
    }

    async addExpenseJoinRequest(userId: string, expenseId: string, requestingUserId: string): Promise<void> {
        await this._leadingExpenseValidator.validate(expenseId);
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

    async setExpensePayers(expenseId: string, payerShares: IPayerShare[]): Promise<IExpenseDto> {
        return await this._expenseManager.setExpensePayers(expenseId, payerShares);
    }

    async setExpensePayerStatus(expenseId: string, userId: string, settled: boolean): Promise<IExpenseDto> {
        return await this._expenseManager.setExpensePayerStatus(expenseId, userId, settled);
    }

    async getLeadingExpenseId(expenseId: string): Promise<string> {
        return this._expenseManager.getLeadingExpenseId(expenseId);
    }

    async getLeadingExpense(expenseId: string): Promise<IExpenseDto> {
        const leadingExpenseId = await this.getLeadingExpenseId(expenseId);
        return this.getExpense(leadingExpenseId);
    }

    async updateExpenseTransactionDate(expenseId: string, transactionDate: Date): Promise<IExpenseDto> {
        return this._expenseManager.updateExpenseTransactionDate(expenseId, transactionDate);
    }
}
