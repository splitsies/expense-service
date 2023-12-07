import { inject, injectable } from "inversify";
import { randomUUID } from "crypto";
import {
    IExpense,
    Expense,
    IExpenseUpdate,
    ExpenseItem,
    IExpenseUpdateMapper,
    IExpenseUserDetails,
} from "@splitsies/shared-models";
import { IExpenseManager } from "./expense-manager-interface";
import { IExpenseDao } from "src/dao/expense-dao/expense-dao-interface";
import { IUserExpenseDao } from "src/dao/user-expense-dao/user-expense-dao-interface";
import { IUserExpense } from "src/models/user-expense/user-expense-interface";
import { UnauthorizedUserError } from "src/models/error/unauthorized-user-error";
import { ILogger } from "@splitsies/utils";

@injectable()
export class ExpenseManager implements IExpenseManager {
    constructor(
        @inject(ILogger) private readonly _logger: ILogger,
        @inject(IExpenseDao) private readonly _expenseDao: IExpenseDao,
        @inject(IUserExpenseDao) private readonly _userExpenseDao: IUserExpenseDao,
        @inject(IExpenseUpdateMapper) private readonly _expenseUpdateMapper: IExpenseUpdateMapper,
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
        const created = await this._expenseDao.create(new Expense(randomUUID(), "", new Date(), []));
        await this._userExpenseDao.create({ expenseId: created.id, userId });
        return created;
    }

    async createExpenseFromImage(expense: IExpense, userId: string): Promise<IExpense> {
        const created = await this._expenseDao.create(expense);
        await this._userExpenseDao.create({ expenseId: created.id, userId });
        return created;
    }

    async updateExpense(id: string, updated: IExpenseUpdate): Promise<IExpense> {
        return await this._expenseDao.update(this._expenseUpdateMapper.toDomainModel(updated, id));
    }

    async getExpensesForUser(userId: string): Promise<IExpense[]> {
        const expenseIds = await this._userExpenseDao.getExpenseIdsForUser(userId);
        if (expenseIds.length === 0) return [];

        return await this._expenseDao.getExpenses(expenseIds);
    }

    async getUsersForExpense(expenseId: string): Promise<string[]> {
        return await this._userExpenseDao.getUsersForExpense(expenseId);
    }

    async addUserToExpense(userExpense: IUserExpense, requestingUserId: string): Promise<void> {
        // make sure the requesting user is actually on the expense
        const original = { userId: requestingUserId, expenseId: userExpense.expenseId } as IUserExpense;
        const key = this._userExpenseDao.key(original);
        const exists = !!(await this._userExpenseDao.read(key));
        if (!exists) throw new UnauthorizedUserError();

        if (!!(await this._userExpenseDao.read(this._userExpenseDao.key(userExpense)))) {
            this._logger.warn(
                `Attempted to add user ${userExpense.userId} to expense ${userExpense.expenseId}, but the entry already exists`,
            );
            return;
        }

        await this._userExpenseDao.create(userExpense);
    }

    async removeUserFromExpense(expenseId: string, userId: string): Promise<void> {
        const key = this._userExpenseDao.key({ expenseId, userId });
        return this._userExpenseDao.delete(key);
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
}
