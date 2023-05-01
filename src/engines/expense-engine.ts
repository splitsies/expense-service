import { inject, injectable } from "inversify";
import { randomUUID } from "crypto";
import { IExpense, Expense } from "@splitsies/shared-models";
import { IExpenseEngine } from "./expense-engine-interface";
import { IExpenseDao } from "src/dao/expense-dao/expense-dao-interface";
import { IExpenseUpdate } from "src/models/expense-update/expense-update-interface";
import { IExpenseUpdateMapper } from "@splitsies/utils";

@injectable()
export class ExpenseEngine implements IExpenseEngine {
    constructor(
        @inject(IExpenseDao) private readonly _expenseDao: IExpenseDao,
        @inject(IExpenseUpdateMapper) private readonly _expenseUpdateMapper: IExpenseUpdateMapper,
    ) {}

    async getExpense(id: string): Promise<IExpense> {
        return await this._expenseDao.read(id);
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
}
