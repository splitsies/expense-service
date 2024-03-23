import { inject, injectable } from "inversify";
import { randomUUID } from "crypto";
import {
    IExpense,
    Expense,
    IExpenseUpdate,
    ExpenseItem,
    IExpenseUpdateMapper,
    IExpenseUserDetails,
    IExpenseJoinRequest,
    IExpenseItem,
} from "@splitsies/shared-models";
import { IExpenseManager } from "./expense-manager-interface";
import { IExpenseDao } from "src/dao/expense-dao/expense-dao-interface";
import { IUserExpenseDao } from "src/dao/user-expense-dao/user-expense-dao-interface";
import { IUserExpense } from "src/models/user-expense/user-expense-interface";
import { ILogger } from "@splitsies/utils";
import { IExpenseJoinRequestDao } from "src/dao/expense-join-request-dao/expense-join-request-dao-interface";
import { IExpenseDaMapper } from "src/mappers/expense-da-mapper-interface";
import { IExpenseItemDao } from "src/dao/expense-item-dao/expense-item-dao-interface";
import { IExpenseDa } from "src/models/expense/expense-da-interface";
import { UserExpense } from "src/models/user-expense/user-expense";

@injectable()
export class ExpenseManager implements IExpenseManager {
    constructor(
        @inject(ILogger) private readonly _logger: ILogger,
        @inject(IExpenseDao) private readonly _expenseDao: IExpenseDao,
        @inject(IUserExpenseDao) private readonly _userExpenseDao: IUserExpenseDao,
        @inject(IExpenseJoinRequestDao) private readonly _expenseJoinRequestDao: IExpenseJoinRequestDao,
        @inject(IExpenseItemDao) private readonly _expenseItemDao: IExpenseItemDao,
        @inject(IExpenseUpdateMapper) private readonly _expenseUpdateMapper: IExpenseUpdateMapper,
        @inject(IExpenseDaMapper) private readonly _expenseDaMapper: IExpenseDaMapper
    ) {}

    async getUserExpense(userId: string, expenseId: string): Promise<IUserExpense> {
        const userExpense = { userId, expenseId } as IUserExpense;
        const key = this._userExpenseDao.key(userExpense);
        return await this._userExpenseDao.read(key);
    }

    async getExpense(id: string): Promise<IExpense> {
        const expenseDa = await this._expenseDao.read({ id });
        const items = await this._expenseItemDao.getForExpense(id);
        return this._expenseDaMapper.fromDa(expenseDa, items);
    }

    async createExpense(userId: string): Promise<IExpense> {
        const created = await this._expenseDao.create(new Expense(randomUUID(), "Untitled", new Date(), []));
        await this._userExpenseDao.create({ expenseId: created.id, userId, pendingJoin: false });
        return this._expenseDaMapper.fromDa(created, []);
    }

    async createExpenseFromImage(expense: IExpense, userId: string): Promise<IExpense> {
        const created = await this._expenseDao.create(expense);
        await Promise.all(expense.items.map(i => this._expenseItemDao.create(i)));
        await this._userExpenseDao.create({ expenseId: created.id, userId, pendingJoin: false });
        return expense;
    }

    async updateExpense(id: string, updated: IExpenseUpdate): Promise<IExpense> {
        const expenseDa = await this._expenseDao.update(this._expenseUpdateMapper.toDomainModel(updated, id));
        const items = await this._expenseItemDao.getForExpense(id);
        return this._expenseDaMapper.fromDa(expenseDa, items);
    }

    // TODO: Make this take in a lastEvaluatedKey and make the front-end infinite scrolling
    async getExpensesForUser(userId: string): Promise<IExpense[]> {
        const expenseToItems = new Map<string, IExpenseItem[]>;
        const expenses = await this._expenseDao.getExpensesForUser(userId);

        await Promise.all(
            expenses.map(e => this._expenseItemDao.getForExpense(e.id).then(items => expenseToItems.set(e.id, items)))
        );

        return expenses.map(e => this._expenseDaMapper.fromDa(e, expenseToItems.get(e.id)));
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

    async removeUserFromExpense(expenseId: string, userId: string): Promise<IExpense> {
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

        const userExpenses = await this._userExpenseDao.getUsersForExpense(expenseId);
        if (userExpenses.length === 0) {
            // If the last user was deleted, delete the expense as well
            await this._expenseDao.delete({ id: expenseId });
        }

        return this.getExpense(expenseId);
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

    async replaceGuestUserInfo(guestUserId: string, registeredUser: IExpenseUserDetails): Promise<IExpense[]> {
        const ues = await this._userExpenseDao.getForUser(guestUserId);
        const userExpenses = await this.getExpensesForUser(guestUserId);

        if (ues.length === 0 || userExpenses.length === 0) return [];

        await Promise.all(ues.map((ue) => this._userExpenseDao.delete(this._userExpenseDao.key(ue))));
        await Promise.all(
            ues.map((ue) => this._userExpenseDao.create({ expenseId: ue.expenseId, userId: registeredUser.id, pendingJoin: false })),
        );

        const updatedExpenses: IExpense[] = [];
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
                    await this.updateExpense(expense.id, this._expenseUpdateMapper.toDtoModel(expense)),
                );
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
    ): Promise<IExpense> {
        const item = new ExpenseItem(randomUUID(), expenseId, name, price, owners, isProportional);
        console.log({ item });
        await this._expenseItemDao.create(item);

        console.log("created the item");

        let expense: IExpenseDa;
        let items: IExpenseItem[];

        await Promise.all([
            this._expenseDao.read({ id: expenseId }).then(e => expense = e),
            this._expenseItemDao.getForExpense(expenseId).then(i => items = i)
        ]);

        return this._expenseDaMapper.fromDa(expense, items);
    }

    async removeExpenseItem(itemId: string, expenseId: string): Promise<IExpense> {
        await this._expenseItemDao.delete({ expenseId, id: itemId });

        let expense: IExpenseDa;
        let items: IExpenseItem[];

        await Promise.all([
            this._expenseDao.read({ id: expenseId }).then(e => expense = e),
            this._expenseItemDao.getForExpense(expenseId).then(i => items = i)
        ]);

        return this._expenseDaMapper.fromDa(expense, items);
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
