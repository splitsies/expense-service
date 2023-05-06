import { inject, injectable } from "inversify";
import { randomUUID } from "crypto";
import { IExpense, Expense, IExpenseUpdate } from "@splitsies/shared-models";
import { IExpenseManager } from "./expense-manager-interface";
import { IExpenseDao } from "src/dao/expense-dao/expense-dao-interface";
import { IExpenseUpdateMapper } from "@splitsies/utils";
import { IUserExpenseDao } from "src/dao/user-expense-dao/user-expense-dao-interface";

@injectable()
export class ExpenseManager implements IExpenseManager {
    constructor(
        @inject(IExpenseDao) private readonly _expenseDao: IExpenseDao,
        @inject(IUserExpenseDao) private readonly _userExpenseDao: IUserExpenseDao,
        @inject(IExpenseUpdateMapper) private readonly _expenseUpdateMapper: IExpenseUpdateMapper,
    ) {}

    async getExpense(id: string): Promise<IExpense> {
        return await this._expenseDao.read({ id });
    }

    async createExpense(): Promise<IExpense> {
        return await this._expenseDao.create(new Expense(randomUUID(), "", new Date(), [], []));
    }

    async createExpenseFromImage(expense: IExpense): Promise<IExpense> {
        return await this._expenseDao.create(expense);
    }

    async updateExpense(id: string, updated: IExpenseUpdate): Promise<IExpense> {
        return await this._expenseDao.update(this._expenseUpdateMapper.toDomainModel(updated, id));
    }

    async getExpensesForUser(userId: string): Promise<IExpense[]> {
        // TODO: Remove once user implemention is in
        return await this._expenseDao.getExpensesForUser(userId);

        // const expenseIds = await this._userExpenseDao.getExpenseIdsForUser(userId);
        // return await Promise.all(expenseIds.map((id) => this._expenseDao.read({ id })));
    }
}
