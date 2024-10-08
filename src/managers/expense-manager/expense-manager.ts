import { inject, injectable } from "inversify";
import { randomUUID } from "crypto";
import {
    ExpenseItem,
    IExpenseUserDetails,
    IExpenseJoinRequest,
    IExpenseItem,
    IExpenseDto,
    QueueMessage,
    IScanResult,
    ScanResult,
    IPayerShare,
    PayerShare,
    ExpensePayerStatus,
} from "@splitsies/shared-models";
import { IExpenseManager } from "./expense-manager-interface";
import { IExpenseDao } from "src/dao/expense-dao/expense-dao-interface";
import { IUserExpenseDao } from "src/dao/user-expense-dao/user-expense-dao-interface";
import { IUserExpense } from "src/models/user-expense/user-expense-interface";
import { ILogger, IMessageQueueClient } from "@splitsies/utils";
import { IExpenseItemDao } from "src/dao/expense-item-dao/expense-item-dao-interface";
import { IExpenseDtoMapper } from "src/mappers/expense-dto-mapper/expense-dto-mapper-interface";
import { ExpenseDa } from "src/models/expense/expense-da";
import { UserExpenseDto } from "src/models/user-expense-dto/user-expense-dto";
import { IUserExpenseDto } from "src/models/user-expense-dto/user-expense-dto-interface";
import { QueueConfig } from "src/config/queue.config";
import { IExpensePayerDao } from "src/dao/expense-payer-dao/expense-payer-dao-interface";
import { ExpensePayer } from "src/models/expense-payer/expense-payer";
import { InvalidStateError } from "src/models/error/invalid-state-error";
import { IExpensePayerStatusDao } from "src/dao/expense-payer-status-dao/expense-payer-status-dao-interface";
import { IUserExpenseStrategy } from "src/strategies/user-expense-strategy/user-expense-strategy.i";
import { IExpenseWriteStrategy } from "src/strategies/expense-write-strategy/expense-write-strategy.i";
import { ILeadingExpenseDao } from "src/dao/leading-expense-dao/leading-expense-dao.i";
import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { IExpenseGroupStrategy } from "src/strategies/expense-group-strategy/expense-group-strategy.i";
import { IExpenseGroupDao } from "src/dao/expense-group-dao/expense-group-dao-interface";
import { IUserDataStrategy } from "src/strategies/user-data-strategy/user-data-strategy.i";
import { Expense } from "src/models/expense";

@injectable()
export class ExpenseManager implements IExpenseManager {
    constructor(
        @inject(ILogger) private readonly _logger: ILogger,
        @inject(IExpenseDao) private readonly _expenseDao: IExpenseDao,
        @inject(IUserExpenseDao) private readonly _userExpenseDao: IUserExpenseDao,
        @inject(IExpenseItemDao) private readonly _expenseItemDao: IExpenseItemDao,
        @inject(IExpensePayerDao) private readonly _expensePayerDao: IExpensePayerDao,
        @inject(IExpenseDtoMapper) private readonly _dtoMapper: IExpenseDtoMapper,
        @inject(IMessageQueueClient) private readonly _messageQueueClient: IMessageQueueClient,
        @inject(IExpensePayerStatusDao) private readonly _expensePayerStatusDao: IExpensePayerStatusDao,
        @inject(IExpenseGroupDao) private readonly _expenseGroupDao: IExpenseGroupDao,
        @inject(IUserExpenseStrategy) private readonly _userExpenseStrategy: IUserExpenseStrategy,
        @inject(IExpenseWriteStrategy) private readonly _expenseWriteStrategy: IExpenseWriteStrategy,
        @inject(ILeadingExpenseDao) private readonly _leadingExpenseDao: ILeadingExpenseDao,
        @inject(IExpenseGroupStrategy) private readonly _expenseGroupStrategy: IExpenseGroupStrategy,
        @inject(IUserDataStrategy) private readonly _userDataStrategy: IUserDataStrategy,
    ) {}

    async queueExpenseUpdate(expenseUpdate: IExpenseDto): Promise<void> {
        await this._messageQueueClient.create(
            new QueueMessage<IExpenseDto>(QueueConfig.expenseUpdate, randomUUID(), expenseUpdate),
        );
    }

    async getUserExpense(userId: string, expenseId: string): Promise<IUserExpense> {
        const userExpense = { userId, expenseId } as IUserExpense;
        const key = this._userExpenseDao.keyFrom(userExpense);
        return await this._userExpenseDao.read(key);
    }

    async getExpense(id: string): Promise<IExpenseDto> {
        let expense: Expense;
        let userIds: string[];
        let items: IExpenseItem[];
        let payers: IPayerShare[];
        let payerStatuses: ExpensePayerStatus[];
        let children: IExpenseDto[];

        const childExpenseIds = await this._expenseGroupDao.getChildExpenseIds(id);

        await Promise.all([
            this._expenseDao.read({ id }).then((e) => (expense = e)),
            this._userExpenseDao.getUsersForExpense(id).then((uids) => (userIds = uids)),
            this._expenseItemDao.getForExpense(id).then((e) => (items = e)),
            this._expensePayerDao
                .getForExpense(id)
                .then((ep) => (payers = ep.map((ep) => new PayerShare(ep.userId, ep.share)))),
            this._expensePayerStatusDao.getForExpense(id).then((ep) => (payerStatuses = ep)),
            Promise.all(childExpenseIds.map((childId) => this.getExpense(childId))).then((c) => (children = c)),
        ]).catch((e) => this._logger.error(`Error fetching expense ${id}`, e));

        return expense !== undefined && items !== undefined && userIds !== undefined
            ? this._dtoMapper.toDto(expense, userIds, items, payers, payerStatuses, children)
            : null;
    }

    async createExpense(userId: string): Promise<IExpenseDto> {
        const expenseDa = await this._expenseWriteStrategy.create(userId);
        return this.getExpense(expenseDa.id);
    }

    async createExpenseFromScan(expense: IExpenseDto, userId: string): Promise<IExpenseDto> {
        const expenseDa = await this._expenseWriteStrategy.create(userId, expense);
        return this.getExpense(expenseDa.id);
    }

    async deleteExpense(id: string): Promise<void> {
        return await this._expenseWriteStrategy.delete(id);
    }

    async addNewExpenseToGroup(
        parentExpenseId: string,
        userId: string,
        childExpense: IExpenseDto | undefined = undefined,
    ): Promise<IExpenseDto> {
        if (!(await this._expenseDao.read({ id: parentExpenseId }))) {
            throw new InvalidStateError("Unable to add child to a non-existent expense");
        }

        childExpense = !childExpense
            ? await this.createExpense(userId)
            : await this.createExpenseFromScan(childExpense, userId);

        await this._expenseGroupStrategy.addExpenseToGroup(parentExpenseId, childExpense.id);
        return this.getExpense(parentExpenseId);
    }

    async addExistingExpenseToGroup(groupExpenseId: string, childExpenseId: string): Promise<void> {
        if (await this._expenseGroupDao.read({ parentExpenseId: groupExpenseId, childExpenseId })) {
            return;
        }

        await this._expenseGroupStrategy.addExpenseToGroup(groupExpenseId, childExpenseId);
    }

    async removeExpenseFromGroup(groupExpenseId: string, childExpenseId: string): Promise<void> {
        if (!(await this._expenseGroupDao.read({ parentExpenseId: groupExpenseId, childExpenseId }))) {
            return;
        }

        await this._expenseGroupStrategy.removeExpenseFromGroup(groupExpenseId, childExpenseId);
    }

    async updateExpense(id: string, updated: IExpenseDto): Promise<IExpenseDto> {
        await this._expenseDao.update(new ExpenseDa(updated.id, updated.name, new Date(updated.transactionDate)));
        return this.getExpense(id);
    }

    async getExpensesForUser(
        userId: string,
        limit: number,
        offset: Record<string, AttributeValue> | undefined,
    ): Promise<IScanResult<IExpenseDto>> {
        const leadingExpenses = await this._leadingExpenseDao.getForUser(userId, limit, offset);
        const expenses = await Promise.all(leadingExpenses.result.map((le) => this.getExpense(le.expenseId)));
        return new ScanResult(expenses, leadingExpenses.lastEvaluatedKey);
    }

    async getUsersForExpense(expenseId: string): Promise<string[]> {
        return await this._userExpenseDao.getUsersForExpense(expenseId);
    }

    async addUserToExpense(userId: string, expenseId: string): Promise<void> {
        await this._userExpenseStrategy.addUserToExpense(userId, expenseId);
    }

    async removeUserFromExpense(expenseId: string, userId: string): Promise<IExpenseDto> {
        const leadingExpenseId = await this.getLeadingExpenseId(expenseId);
        await this._userExpenseStrategy.removeUserFromExpense(leadingExpenseId, userId);
        return this.getExpense(leadingExpenseId);
    }

    async getExpenseJoinRequestsForUser(
        userId: string,
        limit: number,
        offset: Record<string, AttributeValue> | undefined,
    ): Promise<IScanResult<IUserExpenseDto>> {
        const scan = await this._userExpenseDao.getJoinRequestsForUser(userId, limit, offset);

        return new ScanResult(
            await Promise.all(
                scan.result.map(
                    async (u) =>
                        new UserExpenseDto(
                            await this.getExpense(u.expenseId),
                            u.userId,
                            u.pendingJoin,
                            u.requestingUserId,
                            u.createdAt,
                        ),
                ),
            ),
            scan.lastEvaluatedKey,
        );
    }

    async getJoinRequestCountForUser(userId: string): Promise<number> {
        return this._userExpenseDao.getJoinRequestCountForUser(userId);
    }

    async getJoinRequestsForExpense(expenseId: string): Promise<IExpenseJoinRequest[]> {
        return this._userExpenseDao.getJoinRequestsForExpense(expenseId) as Promise<IExpenseJoinRequest[]>;
    }

    async addExpenseJoinRequest(userId: string, expenseId: string, requestingUserId: string): Promise<void> {
        return this._userExpenseStrategy.addUserToExpenseAsJoinRequest(userId, expenseId, requestingUserId);
    }

    async removeExpenseJoinRequest(userId: string, expenseId: string): Promise<void> {
        await this._userExpenseStrategy.acceptExpenseJoinRequest(userId, expenseId);
    }

    async replaceGuestUserInfo(guestUserId: string, registeredUser: IExpenseUserDetails): Promise<IExpenseDto[]> {
        const updatedExpenseIds = await this._userDataStrategy.replaceGuestUserInfo(guestUserId, registeredUser);
        return Promise.all(updatedExpenseIds.map(async (id) => await this.getExpense(id)));
    }

    async addExpenseItem(
        name: string,
        price: number,
        owners: IExpenseUserDetails[],
        isProportional: boolean,
        expenseId: string,
    ): Promise<IExpenseDto> {
        const item = new ExpenseItem(randomUUID(), expenseId, name, price, owners, isProportional, Date.now());
        await this._expenseItemDao.create(item);
        return this.getExpense(expenseId);
    }

    async removeExpenseItem(itemId: string, expenseId: string): Promise<IExpenseDto> {
        await this._expenseItemDao.delete({ expenseId, id: itemId });
        return this.getExpense(expenseId);
    }

    async getExpenseItems(expenseId: string): Promise<IExpenseItem[]> {
        return this._expenseItemDao.getForExpense(expenseId);
    }

    async saveUpdatedItems(updatedItems: IExpenseItem[]): Promise<IExpenseItem[]> {
        return Promise.all(updatedItems.map((i) => this._expenseItemDao.update(i)));
    }

    async deleteUserData(userId: string): Promise<string[]> {
        return await this._userDataStrategy.deleteUserData(userId);
    }

    async setExpensePayers(expenseId: string, payerShares: IPayerShare[]): Promise<IExpenseDto> {
        let shareSum = 0;
        const lookup = new Map<string, IPayerShare>();
        for (const payer of payerShares) {
            lookup.set(payer.userId, payer);
            shareSum += payer.share;
        }

        if (Math.abs(1 - shareSum) > Number.EPSILON) {
            // Validation to floating point accuracy
            throw new InvalidStateError("Payer shares did not add up to 1");
        }

        const expensePayers = await this._expensePayerDao.getForExpense(expenseId);
        for (const payer of expensePayers) {
            const existing = lookup.get(payer.userId);
            if (existing && existing.share !== payer.share) {
                await this._expensePayerDao.update(new ExpensePayer(payer.expenseId, existing.userId, existing.share));
                // Delete once we're done updating it
                lookup.delete(payer.userId);
                continue;
            } else if (!existing) {
                await this._expensePayerDao.delete({ expenseId, userId: payer.userId });
            }
        }

        // The payers remaining in the lookup are new, so they need to be added
        for (const [userId, payer] of lookup) {
            if (!expensePayers.find((p) => p.userId === payer.userId)) {
                await this._expensePayerDao.create(new ExpensePayer(expenseId, userId, payer.share));
            }
        }

        return await this.getExpense(expenseId);
    }

    async setExpensePayerStatus(expenseId: string, userId: string, settled: boolean): Promise<IExpenseDto> {
        if (!(await this._expensePayerStatusDao.read({ expenseId, userId }))) {
            await this._expensePayerStatusDao.create(new ExpensePayerStatus(expenseId, userId, settled));
        } else {
            await this._expensePayerStatusDao.update(new ExpensePayerStatus(expenseId, userId, settled));
        }

        return this.getExpense(expenseId);
    }

    async getLeadingExpenseId(expenseId: string): Promise<string> {
        return (await this._expenseGroupDao.getParentExpenseId(expenseId)) ?? expenseId;
    }

    async updateExpenseTransactionDate(expenseId: string, transactionDate: Date): Promise<IExpenseDto> {
        await this._expenseWriteStrategy.updateTransactionDate(expenseId, transactionDate);
        return this.getExpense(expenseId);
    }
}
