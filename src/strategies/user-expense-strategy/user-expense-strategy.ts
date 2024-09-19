import { inject, injectable } from "inversify";
import { IUserExpenseStrategy } from "./user-expense-strategy.i";
import { ExpensePayerStatus } from "@splitsies/shared-models";
import { IExpensePayerStatusDao } from "src/dao/expense-payer-status-dao/expense-payer-status-dao-interface";
import { IUserExpenseDao } from "src/dao/user-expense-dao/user-expense-dao-interface";
import { UserExpense } from "src/models/user-expense/user-expense";
import { IExpenseGroupDao } from "src/dao/expense-group-dao/expense-group-dao-interface";
import { ILeadingExpenseDao } from "src/dao/leading-expense-dao/leading-expense-dao.i";
import { LeadingExpense } from "src/models/leading-expense";
import { IExpenseDao } from "src/dao/expense-dao/expense-dao-interface";
import { IExpenseItemDao } from "src/dao/expense-item-dao/expense-item-dao-interface";
import { IExpensePayerDao } from "src/dao/expense-payer-dao/expense-payer-dao-interface";
import { IDynamoDbTransactionStrategy } from "@splitsies/utils";

@injectable()
export class UserExpenseStrategy implements IUserExpenseStrategy {
    constructor(
        @inject(IExpenseDao) private readonly _expenseDao: IExpenseDao,
        @inject(ILeadingExpenseDao) private readonly _leadingExpenseDao: ILeadingExpenseDao,
        @inject(IExpenseGroupDao) private readonly _expenseGroupDao: IExpenseGroupDao,
        @inject(IUserExpenseDao) private readonly _userExpenseDao: IUserExpenseDao,
        @inject(IExpensePayerStatusDao) private readonly _expensePayerStatusDao: IExpensePayerStatusDao,
        @inject(IExpenseItemDao) private readonly _expenseItemDao: IExpenseItemDao,
        @inject(IExpensePayerDao) private readonly _expensePayerDao: IExpensePayerDao,
        @inject(IDynamoDbTransactionStrategy) private readonly _transactionStrategy: IDynamoDbTransactionStrategy,
    ) {}

    async addUserToExpense(
        userId: string,
        expenseId: string,
        addToChildren = true,
        transaction: Promise<boolean> = undefined,
    ): Promise<void> {
        await this.addSingleUserToExpense(userId, expenseId, undefined, transaction);

        if (addToChildren) {
            await this.addUserToChildren(userId, expenseId, transaction);
        }
    }

    async addUserToChildren(
        userId: string,
        expenseId: string,
        transaction: Promise<boolean> = undefined,
    ): Promise<void> {
        const childExpenseIds = await this._expenseGroupDao.getChildExpenseIds(expenseId);
        if (childExpenseIds.length === 0) return;

        const transact = async (success: Promise<boolean>) => {
            await Promise.all(
                childExpenseIds.map(async (childId) =>
                    this.addSingleUserToExpense(userId, childId, undefined, success),
                ),
            );
        };

        await (transaction !== undefined
            ? transact(transaction)
            : this._transactionStrategy.runWithSimpleTransaction(transact));
    }

    async addUserToExpenseAsJoinRequest(userId: string, expenseId: string, requestingUserId: string): Promise<void> {
        await this.addSingleUserToExpense(userId, expenseId, requestingUserId);
        await this.addUserToChildren(userId, expenseId);
    }

    async acceptExpenseJoinRequest(userId: string, expenseId: string): Promise<void> {
        const updatedUserExpense = { userId, expenseId, pendingJoin: false };
        const expense = await this._expenseDao.read({ id: expenseId });
        if (!expense) return;

        this._transactionStrategy.runWithSimpleTransaction(async (transaction) => {
            const writes = [];

            if (!(await this._expenseGroupDao.getParentExpenseId(expenseId))) {
                writes.push(
                    this._leadingExpenseDao.create(
                        new LeadingExpense(userId, expense.transactionDate, expense.id),
                        transaction,
                    ),
                );
            }

            writes.push(this._userExpenseDao.update(updatedUserExpense, transaction));
            await Promise.all(writes);
        });
    }

    async removeUserFromExpense(
        expenseId: string,
        userId: string,
        transaction: Promise<boolean> = undefined,
    ): Promise<void> {
        const transact = async (success: Promise<boolean>) => {
            const writes: Promise<any>[] = [];
            const expense = await this._expenseDao.read({ id: expenseId });

            writes.push(this._leadingExpenseDao.deleteByValues(userId, expense, success));

            const payerRecord = await this._expensePayerDao.read({ expenseId, userId });
            if (payerRecord) {
                writes.push(this._expensePayerDao.delete({ expenseId, userId }, success));
            }

            const payerStatus = await this._expensePayerStatusDao.read({ expenseId, userId });
            if (payerStatus) {
                writes.push(this._expensePayerStatusDao.delete({ expenseId, userId }, success));
            }

            const items = await this._expenseItemDao.getForExpense(expenseId);

            for (const item of items) {
                const userIndex = item.owners.findIndex((o) => o.id === userId);
                if (userIndex !== -1) {
                    item.owners.splice(userIndex, 1);
                    writes.push(this._expenseItemDao.update(item, success));
                }
            }

            const key = this._userExpenseDao.keyFrom({ expenseId, userId, pendingJoin: false });
            writes.push(this._userExpenseDao.delete(key, success));

            const userExpenses = await this._userExpenseDao.getUsersForExpense(expenseId);
            if (userExpenses.length === 0) {
                // If the last user was deleted, delete the expense as well
                writes.push(this._expenseDao.delete({ id: expenseId }, success));
            }

            const childIds = await this._expenseGroupDao.getChildExpenseIds(expenseId);
            if (childIds.length > 0) {
                writes.push(...childIds.map((cid) => this.removeUserFromExpense(cid, userId, success)));
            }

            await Promise.all(writes);
        };

        await (transaction !== undefined
            ? transact(transaction)
            : this._transactionStrategy.runWithSimpleTransaction(transact));
    }

    private async addSingleUserToExpense(
        userId: string,
        expenseId: string,
        requestingUserId: string | undefined = undefined,
        transaction: Promise<boolean> = undefined,
    ): Promise<void> {
        const transact = async (success: Promise<boolean>) => {
            const writes: Promise<any>[] = [];
            if (await this._userExpenseDao.read({ userId, expenseId })) {
                return;
            }

            if (!(await this._expensePayerStatusDao.read({ expenseId, userId }))) {
                writes.push(
                    this._expensePayerStatusDao.create(new ExpensePayerStatus(expenseId, userId, false), success),
                );
            }

            if (requestingUserId === undefined && !(await this._expenseGroupDao.getParentExpenseId(expenseId))) {
                // Adding user without a request and no parent, so add a leading expense record for the user for it to be on their expense list
                const expense = await this._expenseDao.read({ id: expenseId });
                writes.push(
                    this._leadingExpenseDao.create(
                        new LeadingExpense(userId, expense.transactionDate, expense.id),
                        success,
                    ),
                );
            }

            writes.push(
                this._userExpenseDao.create(
                    new UserExpense(
                        expenseId,
                        userId,
                        requestingUserId !== undefined,
                        requestingUserId,
                        new Date(Date.now()),
                    ),
                    success,
                ),
            );

            await Promise.all(writes);
        };

        await (transaction !== undefined
            ? transact(transaction)
            : this._transactionStrategy.runWithSimpleTransaction(transact));
    }
}
