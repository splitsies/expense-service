import { inject, injectable } from "inversify";
import { randomUUID } from "crypto";
import {
    ExpenseItem,
    IExpenseUserDetails,
    IExpenseJoinRequest,
    IExpenseItem,
    IExpenseDto,
} from "@splitsies/shared-models";
import { IExpenseManager } from "./expense-manager-interface";
import { IExpenseDao } from "src/dao/expense-dao/expense-dao-interface";
import { IUserExpenseDao } from "src/dao/user-expense-dao/user-expense-dao-interface";
import { IUserExpense } from "src/models/user-expense/user-expense-interface";
import { ILogger } from "@splitsies/utils";
import { IExpenseJoinRequestDao } from "src/dao/expense-join-request-dao/expense-join-request-dao-interface";
import { IExpenseItemDao } from "src/dao/expense-item-dao/expense-item-dao-interface";
import { IExpenseDa } from "src/models/expense/expense-da-interface";
import { UserExpense } from "src/models/user-expense/user-expense";
import { IExpenseDtoMapper } from "src/mappers/expense-dto-mapper.ts/expense-dto-mapper-interface";
import { ExpenseDa } from "src/models/expense/expense-da";
import { IExpenseUpdate } from "src/models/expense-update/expense-update-interface";
import { IExpenseUpdateDao } from "src/dao/expense-update-dao/expense-update-dao-interface";

@injectable()
export class ExpenseManager implements IExpenseManager {
    constructor(
        @inject(ILogger) private readonly _logger: ILogger,
        @inject(IExpenseDao) private readonly _expenseDao: IExpenseDao,
        @inject(IUserExpenseDao) private readonly _userExpenseDao: IUserExpenseDao,
        @inject(IExpenseJoinRequestDao) private readonly _expenseJoinRequestDao: IExpenseJoinRequestDao,
        @inject(IExpenseItemDao) private readonly _expenseItemDao: IExpenseItemDao,
        @inject(IExpenseDtoMapper) private readonly _dtoMapper: IExpenseDtoMapper,
        @inject(IExpenseUpdateDao) private readonly _expenseUpdateDao: IExpenseUpdateDao
    ) { }
    
    async queueExpenseUpdate(expenseUpdate: IExpenseUpdate): Promise<void> {
        console.log({ creating: expenseUpdate });
        await this._expenseUpdateDao.create(expenseUpdate);
    }

    async deleteExpenseUpdates(expenseUpdates: IExpenseUpdate[]): Promise<void> {
        await this._expenseUpdateDao.deleteBatch(expenseUpdates);
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

        await Promise.all([
            this._expenseDao.read({ id }).then(e => expenseDa = e),
            this._userExpenseDao.getUsersForExpense(id).then(u => userIds = u),
            this._expenseItemDao.getForExpense(id).then(e => items = e)
        ]).catch(e => this._logger.error(`Error fetching expense ${id}`, e));

        return (expenseDa !== undefined && items !== undefined && userIds !== undefined)
            ? this._dtoMapper.toDto(expenseDa, userIds, items)
            : null;
    }

    async createExpense(userId: string): Promise<IExpenseDto> {
        const id = randomUUID();
        const created = await this._expenseDao.create(new ExpenseDa(id, "Untitled", new Date()));
        await this._userExpenseDao.create({ expenseId: created.id, userId, pendingJoin: false });
        return this.getExpense(id);
    }

    async createExpenseFromScan(expense: IExpenseDto, userId: string): Promise<IExpenseDto> {
        await this._expenseDao.create(new ExpenseDa(expense.id, expense.name, new Date(expense.transactionDate)));
        await Promise.all(expense.items.map(i => this._expenseItemDao.create(i)))
            .catch(e => this._logger.error(`Error creating expense item`, e));
        await this._userExpenseDao.create(new UserExpense(expense.id, userId, false));

        return this.getExpense(expense.id);
    }

    async updateExpense(id: string, updated: IExpenseDto): Promise<IExpenseDto> {
        await this._expenseDao.update(new ExpenseDa(updated.id, updated.name, new Date(updated.transactionDate)));
        return this.getExpense(id);
    }

    // TODO: Make this take in a lastEvaluatedKey and make the front-end infinite scrolling
    async getExpensesForUser(userId: string): Promise<IExpenseDto[]> {
        const expenseToItems = new Map<string, IExpenseItem[]>;
        const expenseToUsers = new Map<string, string[]>;
        const expenses = await this._expenseDao.getExpensesForUser(userId);

        await Promise.all(
            expenses.map(async e => {
                const items = await this._expenseItemDao.getForExpense(e.id)
                expenseToItems.set(e.id, items);
                const users = await this._userExpenseDao.getUsersForExpense(e.id);
                expenseToUsers.set(e.id, users);
            })
        );

        return expenses.map(e => this._dtoMapper.toDto(e, expenseToUsers.get(e.id), expenseToItems.get(e.id)));
    }

    async getUsersForExpense(expenseId: string): Promise<string[]> {
        return await this._userExpenseDao.getUsersForExpense(expenseId);
    }

    async addUserToExpense(userId: string, expenseId: string, requestingUserId: string): Promise<void> {
        if (await this._userExpenseDao.read({ userId, expenseId })) {
            return;
        }

        if (
            userId !== requestingUserId &&
            !(await this._userExpenseDao.read({ userId: requestingUserId, expenseId: expenseId }))
        ) {
            this._logger.warn(
                `User ${requestingUserId} not authorized to add users to expense ${expenseId}`,
            );
            return;
        }

        await this._userExpenseDao.create(
            new UserExpense(expenseId, userId, userId !== requestingUserId, requestingUserId, new Date(Date.now()))
        );
    }

    async removeUserFromExpense(expenseId: string, userId: string): Promise<IExpenseDto> {
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

        return expense;
    }

    async getExpenseJoinRequestsForUser(userId: string): Promise<IExpenseJoinRequest[]> {
        return this._userExpenseDao.getJoinRequestsForUser(userId) as Promise<IExpenseJoinRequest[]>;
    }

    async getJoinRequestsForExpense(expenseId: string): Promise<IExpenseJoinRequest[]> {
        return this._userExpenseDao.getJoinRequestsForExpense(expenseId) as Promise<IExpenseJoinRequest[]>;
    }

    async addExpenseJoinRequest(userId: string, expenseId: string, requestingUserId: string): Promise<void> {
        const request = { userId, expenseId, pendingJoin: true, requestingUserId, createdAt: new Date(Date.now()) } as IUserExpense;
        const existing = await this._userExpenseDao.read({ userId: userId, expenseId: expenseId });

        if (existing) {
            throw new Error("This user expense already exists");
        }

        await this._userExpenseDao.create(request);
    }

    async removeExpenseJoinRequest(userId: string, expenseId: string, requestingUserId: string): Promise<void> {
        const updatedUserExpense = { userId, expenseId, pendingJoin: false };
        await this._userExpenseDao.update(updatedUserExpense);
    }

    async replaceGuestUserInfo(guestUserId: string, registeredUser: IExpenseUserDetails): Promise<IExpenseDto[]> {
        const ues = await this._userExpenseDao.getForUser(guestUserId);
        const userExpenses = await this.getExpensesForUser(guestUserId);

        if (ues.length === 0 || userExpenses.length === 0) return [];

        await Promise.all(ues.map((ue) => this._userExpenseDao.delete(this._userExpenseDao.key(ue))));
        await Promise.all(
            ues.map((ue) => this._userExpenseDao.create({ expenseId: ue.expenseId, userId: registeredUser.id, pendingJoin: false })),
        );

        const updatedExpenses: IExpenseDto[] = [];
        for (const expense of userExpenses) {
            let shouldUpdate = false;
            for (const item of expense.items) {
                const idx = item.owners.findIndex((e) => e.id === guestUserId);
                if (idx === -1) {
                    continue;
                }

                shouldUpdate = true;
                item.owners.splice(idx, 1);
                item.owners.push(registeredUser);
            }

            if (shouldUpdate) {
                updatedExpenses.push(
                    await this.updateExpense(expense.id, expense));
            }
        }

        return updatedExpenses;
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
        return Promise.all(updatedItems.map(i => this._expenseItemDao.update(i)));
    }

    async joinRequestExists(userId: string, expenseId: string): Promise<boolean> {
        const key = this._expenseJoinRequestDao.key({ userId, expenseId, requestingUserId: "", createdAt: new Date() });
        return !!(await this._expenseJoinRequestDao.read(key));
    }
}
