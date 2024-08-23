import { inject, injectable } from "inversify";
import { IParentChildUserSyncStrategy } from "./parent-child-user-sync-strategy.i";
import { IUserExpenseDao } from "src/dao/user-expense-dao/user-expense-dao-interface";
import { IExpenseGroupDao } from "src/dao/expense-group-dao/expense-group-dao-interface";
import { IUserExpenseStrategy } from "../user-expense-strategy/user-expense-strategy.i";

@injectable()
export class ParentChildUserSyncStrategy implements IParentChildUserSyncStrategy {
    constructor(
        @inject(IExpenseGroupDao) private readonly _expenseGroupDao: IExpenseGroupDao,
        @inject(IUserExpenseDao) private readonly _userExpenseDao: IUserExpenseDao,
        @inject(IUserExpenseStrategy) private readonly _userExpenseStrategy: IUserExpenseStrategy,
    ) { }
    
    async sync(parentExpenseId: string): Promise<void> {
        const users = await this._userExpenseDao.getUsersForExpense(parentExpenseId);
        const childIds = await this._expenseGroupDao.getChildExpenseIds(parentExpenseId);
        const promises: Promise<void[]>[] = [];

        // Add each of the parent's users to each child
        promises.push(
            ...childIds.map(async childId => {
                return await Promise.all(
                    users.map((userId) => this._userExpenseStrategy.addUserToExpense(userId, childId)));
            })
        );

        // Add each of each child's users to the parent
        promises.push(
            ...childIds.map(async childId => {
                const userIds = await this._userExpenseDao.getUsersForExpense(childId);
                return await Promise.all(
                    userIds.map(userId => this._userExpenseStrategy.addUserToExpense(userId, parentExpenseId)));
            })
        );

        await Promise.all(promises);
    }
}