import { inject, injectable } from "inversify";
import { IUserExpenseStrategy } from "./user-expense-strategy.i";
import { ExpensePayerStatus } from "@splitsies/shared-models";
import { IExpensePayerStatusDao } from "src/dao/expense-payer-status-dao/expense-payer-status-dao-interface";
import { IUserExpenseDao } from "src/dao/user-expense-dao/user-expense-dao-interface";
import { UserExpense } from "src/models/user-expense/user-expense";
import { IExpenseGroupDao } from "src/dao/expense-group-dao/expense-group-dao-interface";

@injectable()
export class UserExpenseStrategy implements IUserExpenseStrategy {
    constructor(
        @inject(IExpenseGroupDao) private readonly _expenseGroupDao: IExpenseGroupDao,
        @inject(IUserExpenseDao) private readonly _userExpenseDao: IUserExpenseDao,
        @inject(IExpensePayerStatusDao) private readonly _expensePayerStatusDao: IExpensePayerStatusDao,
    ) { }
    
    async addUserToExpense(userId: string, expenseId: string, addToChildren = true): Promise<void> {
        await this.addSingleUserToExpense(userId, expenseId);

        if (addToChildren) {
            await this.addUserToChildren(userId, expenseId);
        }
    }

    async addUserToChildren(userId: string, expenseId: string): Promise<void> {
        const childExpenseIds = await this._expenseGroupDao.getChildExpenseIds(expenseId);
        if (childExpenseIds.length === 0) return;

        await Promise.all(childExpenseIds.map(async (childId) => this.addSingleUserToExpense(userId, childId)));
    }

    async addUserToExpenseAsJoinRequest(userId: string, expenseId: string, requestingUserId: string): Promise<void> {
        await this.addSingleUserToExpense(userId, expenseId, requestingUserId);
        await this.addUserToChildren(userId, expenseId);
    }

    private async addSingleUserToExpense(userId: string, expenseId: string, requestingUserId: string | undefined  = undefined): Promise<void> {
        if (await this._userExpenseDao.read({ userId, expenseId })) {
            return;
        }

        if (!(await this._expensePayerStatusDao.read({ expenseId, userId }))) {
            await this._expensePayerStatusDao.create(new ExpensePayerStatus(expenseId, userId, false));
        }

        await this._userExpenseDao.create(
            new UserExpense(expenseId, userId, requestingUserId !== undefined, requestingUserId, new Date(Date.now())),
        );
    }
}