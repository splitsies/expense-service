import { inject, injectable } from "inversify";
import { IExpenseGroupStrategy } from "./expense-group-strategy.i";
import { ILeadingExpenseDao } from "src/dao/leading-expense-dao/leading-expense-dao.i";
import { IExpenseGroupDao } from "src/dao/expense-group-dao/expense-group-dao-interface";
import { ExpenseGroupDa } from "src/models/expense-group-da";
import { IUserExpenseDao } from "src/dao/user-expense-dao/user-expense-dao-interface";
import { IExpenseDao } from "src/dao/expense-dao/expense-dao-interface";
import { LeadingExpense } from "src/models/leading-expense";
import { IParentChildUserSyncStrategy } from "../parent-child-user-sync-strategy/parent-child-user-sync-strategy.i";

@injectable()
export class ExpenseGroupStrategy implements IExpenseGroupStrategy {

    constructor(
        @inject(IExpenseDao) private readonly _expenseDao: IExpenseDao,
        @inject(IUserExpenseDao) private readonly _userExpenseDao: IUserExpenseDao,
        @inject(IExpenseGroupDao) private readonly _expenseGroupDao: IExpenseGroupDao,
        @inject(ILeadingExpenseDao) private readonly _leadingExpenseDao: ILeadingExpenseDao,
        @inject(IParentChildUserSyncStrategy) private readonly _parentChildUserSyncStrategy: IParentChildUserSyncStrategy,
    ) {}

    async addExpenseToGroup(parentExpenseId: string, childExpenseId: string): Promise<void> {
        await this._expenseGroupDao.create(new ExpenseGroupDa(parentExpenseId, childExpenseId));

        const childExpense = await this._expenseDao.read({ id: childExpenseId });
        const childExpenseUserIds = await this._userExpenseDao.getUsersForExpense(childExpenseId);

        await Promise.all(childExpenseUserIds.map(async userId => {
            const key = this._leadingExpenseDao.keyFrom(new LeadingExpense(userId, childExpense.transactionDate, childExpense.id));
            await this._leadingExpenseDao.delete(key);
        }));

        await this._parentChildUserSyncStrategy.sync(parentExpenseId);
    }

    async removeExpenseFromGroup(parentExpenseId: string, childExpenseId: string): Promise<void> {
        await this._expenseGroupDao.delete(new ExpenseGroupDa(parentExpenseId, childExpenseId));

        const childExpense = await this._expenseDao.read({ id: childExpenseId });
        const childExpenseUserIds = await this._userExpenseDao.getUsersForExpense(childExpenseId);

        await Promise.all(
            childExpenseUserIds.map(userId => this._leadingExpenseDao.create(new LeadingExpense(userId, childExpense.transactionDate, childExpense.name)))
        );

        await this._parentChildUserSyncStrategy.sync(parentExpenseId);
    }
}