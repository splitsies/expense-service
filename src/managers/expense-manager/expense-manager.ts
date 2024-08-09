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
import { IExpenseDa } from "src/models/expense/expense-da-interface";
import { UserExpense } from "src/models/user-expense/user-expense";
import { IExpenseDtoMapper } from "src/mappers/expense-dto-mapper/expense-dto-mapper-interface";
import { ExpenseDa } from "src/models/expense/expense-da";
import { UserExpenseDto } from "src/models/user-expense-dto/user-expense-dto";
import { IUserExpenseDto } from "src/models/user-expense-dto/user-expense-dto-interface";
import { QueueConfig } from "src/config/queue.config";
import { IExpensePayerDao } from "src/dao/expense-payer-dao/expense-payer-dao-interface";
import { ExpensePayer } from "src/models/expense-payer/expense-payer";
import { InvalidStateError } from "src/models/error/invalid-state-error";
import { IExpensePayerStatusDao } from "src/dao/expense-payer-status-dao/expense-payer-status-dao-interface";
import { IExpenseGroupDao } from "src/dao/expense-group-dao/expense-group-dao-interface";
import { ExpenseGroupDa } from "src/models/expense-group-da";

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
        @inject(IExpenseGroupDao) private readonly _expenseGroupDao: IExpenseGroupDao
    ) {}

    async queueExpenseUpdate(expenseUpdate: IExpenseDto): Promise<void> {
        await this._messageQueueClient.create(
            new QueueMessage<IExpenseDto>(QueueConfig.expenseUpdate, randomUUID(), expenseUpdate),
        );
    }
    async getUserExpense(userId: string, expenseId: string): Promise<IUserExpense> {
        const userExpense = { userId, expenseId } as IUserExpense;
        const key = this._userExpenseDao.key(userExpense);
        return await this._userExpenseDao.read(key);
    }

    async getExpense(id: string): Promise<IExpenseDto> {
        let expenseDa: IExpenseDa;
        let items: IExpenseItem[];
        let userIds: string[];
        let payers: IPayerShare[];
        let payerStatuses: ExpensePayerStatus[];
        let children: IExpenseDto[];

        const childExpenseIds = await this._expenseDao.getChildExpenseIds(id);

        await Promise.all([
            this._expenseDao.read({ id }).then((e) => (expenseDa = e)),
            this._userExpenseDao.getUsersForExpense(id).then((u) => (userIds = u)),
            this._expenseItemDao.getForExpense(id).then((e) => (items = e)),
            this._expensePayerDao
                .getForExpense(id)
                .then((ep) => (payers = ep.map((ep) => new PayerShare(ep.userId, ep.share)))),
            this._expensePayerStatusDao.getForExpense(id).then((ep) => (payerStatuses = ep)),
            Promise.all(childExpenseIds.map(cid => this.getExpense(cid))).then(value => children = value),
        ]).catch((e) => this._logger.error(`Error fetching expense ${id}`, e));

        return expenseDa !== undefined && items !== undefined && userIds !== undefined
            ? this._dtoMapper.toDto(expenseDa, userIds, items, payers, payerStatuses, children)
            : null;
    }

    async createExpense(userId: string): Promise<IExpenseDto> {
        const id = randomUUID();
        const created = await this._expenseDao.create(new ExpenseDa(id, "Untitled", new Date()));
        await Promise.all([
            this._userExpenseDao.create({ expenseId: created.id, userId, pendingJoin: false }),
            this._expensePayerDao.create(new ExpensePayer(id, userId, 1)),
            this._expensePayerStatusDao.create(new ExpensePayerStatus(id, userId, false)),
        ]);

        return this.getExpense(id);
    }

    async createExpenseFromScan(expense: IExpenseDto, userId: string): Promise<IExpenseDto> {
        await this._expenseDao.create(new ExpenseDa(expense.id, expense.name, new Date(expense.transactionDate)));
        await Promise.all(expense.items.map((i) => this._expenseItemDao.create(i))).catch((e) =>
            this._logger.error(`Error creating expense item`, e),
        );

        await Promise.all([
            this._userExpenseDao.create(new UserExpense(expense.id, userId, false)),
            this._expensePayerDao.create(new ExpensePayer(expense.id, userId, 1)),
            this._expensePayerStatusDao.create(new ExpensePayerStatus(expense.id, userId, false)),
        ]);

        return this.getExpense(expense.id);
    }

    async addToExpenseGroup(parentExpenseId: string, userId: string, childExpense: IExpenseDto | undefined = undefined): Promise<IExpenseDto> {
        if (!(await this._expenseDao.read({ id: parentExpenseId }))) {
            throw new InvalidStateError("Unable to add child to a non-existent expense");
        }

        if (!childExpense) {
            childExpense = await this.createExpense(userId);
        } else {
            await this.createExpenseFromScan(childExpense, userId);
        }

        this._expenseGroupDao.create(new ExpenseGroupDa(parentExpenseId, childExpense.id));

        const childUsers = await this._userExpenseDao.getUsersForExpense(childExpense.id);
        const users = await this._userExpenseDao.getUsersForExpense(parentExpenseId);

        await Promise.all(users.map(uid => this.addUserToExpense(uid, childExpense.id, userId, uid)));
        await Promise.all(childUsers.map(uid => this.addUserToExpense(uid, parentExpenseId, userId, uid)));
        return this.getExpense(parentExpenseId);
    }

    async updateExpense(id: string, updated: IExpenseDto): Promise<IExpenseDto> {
        await this._expenseDao.update(new ExpenseDa(updated.id, updated.name, new Date(updated.transactionDate)));
        return this.getExpense(id);
    }

    async getExpensesForUser(userId: string, limit: number, offset: number): Promise<IScanResult<IExpenseDto>> {
        const expenseToItems = new Map<string, IExpenseItem[]>();
        const expenseToUsers = new Map<string, string[]>();
        const expenseToPayers = new Map<string, IPayerShare[]>();
        const expenseToPayerStatuses = new Map<string, ExpensePayerStatus[]>();
        const expenseToChildren = new Map <string, IExpenseDto[]>();
        const expenses = await this._expenseDao.getExpensesForUser(userId, limit, offset);

        await Promise.all(
            expenses.result.map(async (e) => {
                const items = await this._expenseItemDao.getForExpense(e.id);
                expenseToItems.set(e.id, items);
                const users = await this._userExpenseDao.getUsersForExpense(e.id);
                expenseToUsers.set(e.id, users);
                const payers = await this._expensePayerDao.getForExpense(e.id);
                expenseToPayers.set(e.id, payers);
                const payerStatuses = await this._expensePayerStatusDao.getForExpense(e.id);
                expenseToPayerStatuses.set(e.id, payerStatuses);
                const childIds = await this._expenseDao.getChildExpenseIds(e.id);
                const children = await Promise.all(childIds.map(id => this.getExpense(id)));
                expenseToChildren.set(e.id, children);
            }),
        );

        const items = await Promise.all(
            expenses.result.map((e) =>
                this._dtoMapper.toDto(
                    e,
                    expenseToUsers.get(e.id),
                    expenseToItems.get(e.id),
                    expenseToPayers.get(e.id),
                    expenseToPayerStatuses.get(e.id),
                    expenseToChildren.get(e.id),
                ),
            ),
        );

        return new ScanResult(items, expenses.lastEvaluatedKey);
    }

    async getUsersForExpense(expenseId: string): Promise<string[]> {
        return await this._userExpenseDao.getUsersForExpense(expenseId);
    }

    async addUserToExpense(
        userId: string,
        expenseId: string,
        requestingUserId: string,
        authorizedUserId: string,
    ): Promise<void> {
        if (await this._userExpenseDao.read({ userId, expenseId })) {
            return;
        }

        if (
            userId !== requestingUserId &&
            !(await this._userExpenseDao.read({ userId: requestingUserId, expenseId: expenseId }))
        ) {
            this._logger.warn(`User ${requestingUserId} not authorized to add users to expense ${expenseId}`);
            return;
        }

        if (!(await this._expensePayerStatusDao.read({ expenseId, userId }))) {
            await this._expensePayerStatusDao.create(new ExpensePayerStatus(expenseId, userId, false));
        }

        await this.addUserToChildren(expenseId, userId, requestingUserId);
        await this._userExpenseDao.create(
            new UserExpense(expenseId, userId, userId !== authorizedUserId, requestingUserId, new Date(Date.now())),
        );
    }

    async removeUserFromExpense(expenseId: string, userId: string): Promise<IExpenseDto> {
        const payerRecord = await this._expensePayerDao.read({ expenseId, userId });
        if (payerRecord) {
            await this._expensePayerDao.delete({ expenseId, userId });
        }

        const payerStatus = await this._expensePayerStatusDao.read({ expenseId, userId });
        if (payerStatus) {
            await this._expensePayerStatusDao.delete({ expenseId, userId });
        }

        const items = await this._expenseItemDao.getForExpense(expenseId);

        for (const item of items) {
            const userIndex = item.owners.findIndex((o) => o.id === userId);
            if (userIndex !== -1) {
                item.owners.splice(userIndex, 1);
                await this._expenseItemDao.update(item);
            }
        }

        const key = this._userExpenseDao.key({ expenseId, userId, pendingJoin: false });
        await this._userExpenseDao.delete(key);

        const expense = this.getExpense(expenseId);
        const userExpenses = await this._userExpenseDao.getUsersForExpense(expenseId);
        if (userExpenses.length === 0) {
            // If the last user was deleted, delete the expense as well
            await this._expenseDao.delete({ id: expenseId });
        }

        const childIds = await this._expenseDao.getChildExpenseIds(expenseId);
        if (childIds.length > 0) {
            await Promise.all(childIds.map(cid => this.removeUserFromExpense(cid, userId)));
        }

        return expense;
    }

    async getExpenseJoinRequestsForUser(
        userId: string,
        limit: number,
        offset: number,
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
        const request = {
            userId,
            expenseId,
            pendingJoin: true,
            requestingUserId,
            createdAt: new Date(Date.now()),
        } as IUserExpense;
        const existing = await this._userExpenseDao.read({ userId: userId, expenseId: expenseId });

        if (existing) {
            throw new Error("This user expense already exists");
        }

        await this._userExpenseDao.create(request);
        await this.addUserToChildren(expenseId, userId, requestingUserId);

        if (!(await this._expensePayerStatusDao.read({ expenseId, userId }))) {
            await this._expensePayerStatusDao.create(new ExpensePayerStatus(expenseId, userId, false));
        }
    }

    async removeExpenseJoinRequest(userId: string, expenseId: string, requestingUserId: string): Promise<void> {
        const updatedUserExpense = { userId, expenseId, pendingJoin: false };
        await this._userExpenseDao.update(updatedUserExpense);
    }

    async replaceGuestUserInfo(guestUserId: string, registeredUser: IExpenseUserDetails): Promise<IExpenseDto[]> {
        const updates: Promise<any>[] = [];

        // Get user expense records
        const ues = await this._userExpenseDao.getForUser(guestUserId);

        // Replace the existing guest id with registered id
        updates.push(...ues.map((ue) => this._userExpenseDao.delete(this._userExpenseDao.key(ue))));
        updates.push(
            ...ues.map((ue) =>
                this._userExpenseDao.create(
                    new UserExpense(ue.expenseId, registeredUser.id, false, ue.requestingUserId),
                ),
            ),
        );

        const updatedExpenseIds: string[] = [];

        // Replace any old item owners with the new user
        for (const { expenseId } of ues) {
            const items = await this._expenseItemDao.getForExpense(expenseId);

            const payer = await this._expensePayerDao.read({ expenseId, userId: guestUserId });
            if (payer) {
                await this._expensePayerDao.delete({ expenseId, userId: guestUserId });
                await this._expensePayerDao.create(new ExpensePayer(expenseId, registeredUser.id, payer.share));
            }

            const payerStatus = await this._expensePayerStatusDao.read({ expenseId, userId: guestUserId });
            if (payerStatus) {
                await this._expensePayerStatusDao.delete({ expenseId, userId: guestUserId });
                await this._expensePayerStatusDao.create(
                    new ExpensePayerStatus(expenseId, registeredUser.id, payerStatus.settled),
                );
            }

            let updated = false;
            for (const item of items) {
                const idx = item.owners.findIndex((e) => e.id === guestUserId);
                if (idx === -1) continue;

                updated = true;
                item.owners.splice(idx, 1);
                item.owners.push(registeredUser);
                updates.push(this._expenseItemDao.update(item));
            }

            if (updated) updatedExpenseIds.push(expenseId);
        }

        await Promise.all(updates);
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
        const expenseIds = [];
        const limit = 500;

        const updatedItems = [];
        let offset = 0;
        let nextOffset = 0;

        this._logger.log(`Deleting user data for ${userId}`);

        do {
            const scanResult = await this._expenseDao.getExpensesForUser(userId, limit, nextOffset);
            expenseIds.push(...scanResult.result.map((e) => e.id));

            for (const expense of scanResult.result) {
                const items = await this._expenseItemDao.getForExpense(expense.id);

                const payer = await this._expensePayerDao.read({ expenseId: expense.id, userId });
                if (payer) {
                    await this._expensePayerDao.delete({ expenseId: expense.id, userId });
                    await this._expensePayerDao.create(new ExpensePayer(expense.id, userId, payer.share));
                }

                const payerStatus = await this._expensePayerStatusDao.read({ expenseId: expense.id, userId });
                if (payerStatus) {
                    await this._expensePayerStatusDao.delete({ expenseId: expense.id, userId });
                    await this._expensePayerStatusDao.create(
                        new ExpensePayerStatus(expense.id, userId, payerStatus.settled),
                    );
                }

                for (const item of items) {
                    const index = item.owners.findIndex((o) => o.id === userId);
                    if (index === -1) continue;

                    item.owners.splice(index, 1);
                    updatedItems.push(item);
                }
            }

            offset = nextOffset;
            nextOffset = (scanResult.lastEvaluatedKey.nextPage as { limit: number; offset: number }).offset;
        } while (offset !== nextOffset);

        await Promise.all([this.saveUpdatedItems(updatedItems), this._userExpenseDao.deleteForUser(userId)]);
        return expenseIds;
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

    private async addUserToChildren(expenseId: string, userId: string, requestingUserId: string): Promise<void> {
        const childExpenseIds = await this._expenseDao.getChildExpenseIds(expenseId);
        await Promise.all(childExpenseIds.map(async childId => {
            if (await this._userExpenseDao.read({ userId, expenseId: childId })) {
                return;
            }

            if (!(await this._expensePayerStatusDao.read({ expenseId: childId, userId }))) {
                await this._expensePayerStatusDao.create(new ExpensePayerStatus(expenseId, userId, false));
            }

            await this._userExpenseDao.create(
                new UserExpense(childId, userId, false, requestingUserId, new Date(Date.now())),
            );
        }));
    }
}
