import { inject, injectable } from "inversify";
import { randomUUID } from "crypto";
import { IExpense, Expense, IExpenseUpdate } from "@splitsies/shared-models";
import { IExpenseManager } from "./expense-manager-interface";
import { IExpenseDao } from "src/dao/expense-dao/expense-dao-interface";
import { IExpenseUpdateMapper } from "@splitsies/utils";
import { IUserExpenseDao } from "src/dao/user-expense-dao/user-expense-dao-interface";
import { IUserExpense } from "src/models/user-expense/user-expense-interface";
import { UnauthorizedUserError } from "src/models/error/unauthorized-user-error";

@injectable()
export class ExpenseManager implements IExpenseManager {
    constructor(
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
        const created = await this._expenseDao.create(new Expense(randomUUID(), "", new Date(), [], []));
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
        return await Promise.all(expenseIds.map((id) => this._expenseDao.read({ id })));
    }

    async addUserToExpense(userExpense: IUserExpense, requestingUserId: string): Promise<void> {
        // make sure the requesting user is actually on the expense
        const original = { userId: requestingUserId, expenseId: userExpense.expenseId } as IUserExpense;
        const key = this._userExpenseDao.key(original);
        const exists = !!(await this._userExpenseDao.read(key));
        if (!exists) throw new UnauthorizedUserError();

        if (!!(await this._userExpenseDao.read(this._userExpenseDao.key(userExpense)))) {
            return;
        }
        await this._userExpenseDao.create(userExpense);
    }
}
