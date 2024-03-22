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
    ExpenseJoinRequest,
    IExpenseItem,
} from "@splitsies/shared-models";
import { IExpenseManager } from "./expense-manager-interface";
import { IExpenseDao } from "src/dao/expense-dao/expense-dao-interface";
import { IUserExpenseDao } from "src/dao/user-expense-dao/user-expense-dao-interface";
import { IUserExpense } from "src/models/user-expense/user-expense-interface";
import { UnauthorizedUserError } from "src/models/error/unauthorized-user-error";
import { ILogger } from "@splitsies/utils";
import { IExpenseJoinRequestDao } from "src/dao/expense-join-request-dao/expense-join-request-dao-interface";
import { IExpenseDaMapper } from "src/mappers/expense-da-mapper-interface";
import { IExpenseItemDao } from "src/dao/expense-item-dao/expense-item-dao-interface";

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
        return await this._expenseDao.read({ id });
    }

    async createExpense(userId: string): Promise<IExpense> {
        const created = await this._expenseDao.create(new Expense(randomUUID(), "Untitled", new Date(), []));
        await this._userExpenseDao.create({ expenseId: created.id, userId, pendingJoin: false });
        return created;
    }

    async createExpenseFromImage(expense: IExpense, userId: string): Promise<IExpense> {
        const created = await this._expenseDao.create(expense);
        await this._userExpenseDao.create({ expenseId: created.id, userId, pendingJoin: false });
        return created;
    }

    async updateExpense(id: string, updated: IExpenseUpdate): Promise<IExpense> {
        return await this._expenseDao.update(this._expenseUpdateMapper.toDomainModel(updated, id));
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

    async addUserToExpense(userExpense: IUserExpense, requestingUserId: string): Promise<void> {
        if (await this._userExpenseDao.read(this._userExpenseDao.key(userExpense))) {
            return;
        }

        if (
            userExpense.userId !== requestingUserId &&
            !(await this._userExpenseDao.read({ userId: requestingUserId, expenseId: userExpense.expenseId }))
        ) {
            this._logger.warn(
                `User ${requestingUserId} not authorized to add users to expense ${userExpense.expenseId}`,
            );
            return;
        }

        await this._userExpenseDao.create(userExpense);
    }

    async removeUserFromExpense(expenseId: string, userId: string): Promise<IExpense> {
        const expense = await this._expenseDao.read({ id: expenseId });

        for (const item of expense.items) {
            const userIndex = item.owners.findIndex((o) => o.id === userId);
            if (userIndex !== -1) item.owners.splice(userIndex, 1);
        }

        const updatedExpense = await this.updateExpense(expenseId, this._expenseUpdateMapper.toDtoModel(expense));
        const key = this._userExpenseDao.key({ expenseId, userId, pendingJoin: false });
        await this._userExpenseDao.delete(key);

        const userExpenses = await this._userExpenseDao.getUsersForExpense(expenseId);
        if (userExpenses.length === 0) {
            // If the last user was deleted, delete the expense as well
            await this._expenseDao.delete({ id: expenseId });
        }

        this.removeExpenseJoinRequest(userId, expenseId, userId);
        return updatedExpense;
    }

    async getExpenseJoinRequestsForUser(userId: string): Promise<IExpenseJoinRequest[]> {
        return this._expenseJoinRequestDao.getForUser(userId);
    }

    async getJoinRequestsForExpense(expenseId: string): Promise<IExpenseJoinRequest[]> {
        return this._expenseJoinRequestDao.getForExpense(expenseId);
    }

    async addExpenseJoinRequest(userId: string, expenseId: string, requestUserId: string): Promise<void> {
        const request = new ExpenseJoinRequest(userId, expenseId, requestUserId, new Date());

        if (!!(await this._expenseJoinRequestDao.read(this._expenseJoinRequestDao.key(request)))) {
            this._logger.log(`User ${userId} already has a request for expense ${expenseId}. Skipping the insert.`);
            return;
        }

        await this._expenseJoinRequestDao.create(request);
    }

    async removeExpenseJoinRequest(userId: string, expenseId: string, requestingUserId: string): Promise<void> {
        const key = this._expenseJoinRequestDao.key({ userId, expenseId, requestingUserId: "", createdAt: new Date() });
        const joinRequest = await this._expenseJoinRequestDao.read(key);

        if (!joinRequest) {
            return;
        }

        if (userId !== requestingUserId && joinRequest.requestingUserId !== requestingUserId) {
            throw new UnauthorizedUserError();
        }

        return this._expenseJoinRequestDao.delete(key);
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

    async addItemToExpense(
        name: string,
        price: number,
        owners: IExpenseUserDetails[],
        isProportional: boolean,
        expenseId: string,
    ): Promise<IExpense> {
        const item = new ExpenseItem(randomUUID(), name, price, owners, isProportional);
        const expense = await this.getExpense(expenseId);
        expense.items.push(item);
        return this.updateExpense(expense.id, this._expenseUpdateMapper.toDtoModel(expense));
    }

    async joinRequestExists(userId: string, expenseId: string): Promise<boolean> {
        const key = this._expenseJoinRequestDao.key({ userId, expenseId, requestingUserId: "", createdAt: new Date() });
        return !!(await this._expenseJoinRequestDao.read(key));
    }
}
