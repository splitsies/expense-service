import { inject, injectable } from "inversify";
import { IUserExpenseStrategy } from "./user-expense-strategy.i";
import { ExpensePayerStatus } from "@splitsies/shared-models";
import { IExpensePayerStatusDao } from "src/dao/expense-payer-status-dao/expense-payer-status-dao-interface";
import { IUserExpenseDao } from "src/dao/user-expense-dao/user-expense-dao-interface";
import { UserExpense } from "src/models/user-expense/user-expense";

@injectable()
export class UserExpenseStrategy implements IUserExpenseStrategy {
    constructor(
        @inject(IUserExpenseDao) private readonly _userExpenseDao: IUserExpenseDao,
        @inject(IExpensePayerStatusDao) private readonly _expensePayerStatusDao: IExpensePayerStatusDao,
    ) { }
    
    async addUserToExpense(userId: string, expenseId: string): Promise<void> {
        if (await this._userExpenseDao.read({ userId, expenseId })) {
            return;
        }

        if (!(await this._expensePayerStatusDao.read({ expenseId, userId }))) {
            await this._expensePayerStatusDao.create(new ExpensePayerStatus(expenseId, userId, false));
        }

        await this._userExpenseDao.create(
            new UserExpense(expenseId, userId, false, undefined, new Date(Date.now())),
        );
    }
}