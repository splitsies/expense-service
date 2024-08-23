import { inject, injectable } from "inversify";
import { IParentChildUserSyncStrategy } from "./parent-child-user-sync-strategy.i";
import { IUserExpenseDao } from "src/dao/user-expense-dao/user-expense-dao-interface";
import { IExpenseGroupDao } from "src/dao/expense-group-dao/expense-group-dao-interface";
import { IExpensePayerStatusDao } from "src/dao/expense-payer-status-dao/expense-payer-status-dao-interface";
import { ExpensePayerStatus } from "@splitsies/shared-models";
import { UserExpense } from "src/models/user-expense/user-expense";

@injectable()
export class ParentChildUserSyncStrategy implements IParentChildUserSyncStrategy {
    constructor(
        @inject(IExpenseGroupDao) private readonly _expenseGroupDao: IExpenseGroupDao,
        @inject(IUserExpenseDao) private readonly _userExpenseDao: IUserExpenseDao,
        @inject(IExpensePayerStatusDao) private readonly _expensePayerStatusDao: IExpensePayerStatusDao,
    ) { }
    
    async sync(parentExpenseId: string): Promise<void> {
        const users = await this._userExpenseDao.getUsersForExpense(parentExpenseId);
        const childIds = await this._expenseGroupDao.getChildExpenseIds(parentExpenseId);
        const promises: Promise<void[]>[] = [];

        // Add each of the parent's users to each child
        promises.push(
            ...childIds.map(async childId => {
                return await Promise.all(users.map((userId) => this.addSingleUserToExpense(userId, childId)));
            })
        );

        // Add each of each child's users to the parent
        promises.push(
            ...childIds.map(async childId => {
                const userIds = await this._userExpenseDao.getUsersForExpense(childId);
                return await Promise.all(userIds.map(userId => this.addSingleUserToExpense(userId, parentExpenseId)));
            })
        );

        await Promise.all(promises);
    }

    private async addSingleUserToExpense(userId: string, expenseId: string): Promise<void> {
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