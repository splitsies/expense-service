import { inject, injectable } from "inversify";
import { randomUUID } from "crypto";
import { IExpense, Expense } from "@splitsies/shared-models";
import { IExpenseEngine } from "./expense-engine-interface";
import { IExpenseDao } from "src/dao/expense-dao/expense-dao-interface";
import { IExpenseUpdate } from "src/models/expense-update/expense-update-interface";

@injectable()
export class ExpenseEngine implements IExpenseEngine {
    constructor(@inject(IExpenseDao) private readonly _expenseDao: IExpenseDao) {}

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
        return await this._expenseDao.update(
            new Expense(
                id,
                updated.name,
                new Date(Date.parse(updated.transactionDate)),
                updated.items,
                updated.proportionalItems,
            ),
        );
    }
}
