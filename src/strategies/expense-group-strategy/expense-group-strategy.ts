import { inject, injectable } from "inversify";
import { IExpenseGroupStrategy } from "./expense-group-strategy.i";
import { ILeadingExpenseDao } from "src/dao/leading-expense-dao/leading-expense-dao.i";
import { ExpenseGroup } from "src/models/expense-group";
import { IUserExpenseDao } from "src/dao/user-expense-dao/user-expense-dao-interface";
import { IExpenseDao } from "src/dao/expense-dao/expense-dao-interface";
import { LeadingExpense } from "src/models/leading-expense";
import { IParentChildUserSyncStrategy } from "../parent-child-user-sync-strategy/parent-child-user-sync-strategy.i";
import { IExpenseGroupDao } from "src/dao/expense-group-dao/expense-group-dao-interface";
import { IDynamoDbTransactionStrategy } from "@splitsies/utils";

@injectable()
export class ExpenseGroupStrategy implements IExpenseGroupStrategy {
    constructor(
        @inject(IExpenseDao) private readonly _expenseDao: IExpenseDao,
        @inject(IUserExpenseDao) private readonly _userExpenseDao: IUserExpenseDao,
        @inject(IExpenseGroupDao) private readonly _expenseGroupDao: IExpenseGroupDao,
        @inject(ILeadingExpenseDao) private readonly _leadingExpenseDao: ILeadingExpenseDao,
        @inject(IParentChildUserSyncStrategy)
        private readonly _parentChildUserSyncStrategy: IParentChildUserSyncStrategy,
        @inject(IDynamoDbTransactionStrategy) private readonly _transactionStrategy: IDynamoDbTransactionStrategy,
    ) {}

    async addExpenseToGroup(parentExpenseId: string, childExpenseId: string): Promise<void> {
        await this._transactionStrategy.runWithSimpleTransaction(async (transaction) => {
            const writes = [];
            writes.push(this._expenseGroupDao.create(new ExpenseGroup(parentExpenseId, childExpenseId), transaction));

            const childExpense = await this._expenseDao.read({ id: childExpenseId });
            const childExpenseUserIds = await this._userExpenseDao.getUsersForExpense(childExpenseId);

            writes.push(
                ...childExpenseUserIds.map(async (userId) => {
                    this._leadingExpenseDao.deleteByValues(userId, childExpense, transaction);
                }),
            );

            writes.push(this._parentChildUserSyncStrategy.sync(parentExpenseId, transaction));
            await Promise.all(writes);
        });
    }

    async removeExpenseFromGroup(parentExpenseId: string, childExpenseId: string): Promise<void> {
        await this._transactionStrategy.runWithSimpleTransaction(async (transaction) => {
            const writes = [];
            writes.push(this._expenseGroupDao.delete(new ExpenseGroup(parentExpenseId, childExpenseId), transaction));

            const childExpense = await this._expenseDao.read({ id: childExpenseId });
            const childExpenseUserIds = await this._userExpenseDao.getUsersForExpense(childExpenseId);

            writes.push(
                ...childExpenseUserIds.map((userId) =>
                    this._leadingExpenseDao.create(
                        new LeadingExpense(userId, childExpense.transactionDate, childExpense.name),
                        transaction,
                    ),
                ),
            );

            writes.push(this._parentChildUserSyncStrategy.sync(parentExpenseId, transaction));
            await Promise.all(writes);
        });
    }
}
