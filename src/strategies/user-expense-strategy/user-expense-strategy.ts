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
import { TransactWriteItem } from "@aws-sdk/client-dynamodb";
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

    async acceptExpenseJoinRequest(userId: string, expenseId: string): Promise<void> {
        const updatedUserExpense = { userId, expenseId, pendingJoin: false };
        const expense = await this._expenseDao.read({ id: expenseId });
        if (!expense) return;

        const writes: TransactWriteItem[] = [];

        if (!(await this._expenseGroupDao.getParentExpenseId(expenseId))) {
            writes.push(
                this._leadingExpenseDao.putCommand(new LeadingExpense(userId, expense.transactionDate, expense.id)),
            );
        }

        writes.push(this._userExpenseDao.putCommand(updatedUserExpense));
        await this._transactionStrategy.execute(writes);
    }

    async removeUserFromExpense(expenseId: string, userId: string): Promise<void> {
        const expense = await this._expenseDao.read({ id: expenseId });

        await this._leadingExpenseDao.delete(
            this._leadingExpenseDao.keyFrom(new LeadingExpense(userId, expense.transactionDate, expenseId)),
        );

        const payerRecord = await this._expensePayerDao.read({ expenseId, userId });
        if (payerRecord) {
            await this._expensePayerDao.delete({ expenseId, userId });
        }

        const payerStatus = await this._expensePayerStatusDao.read({ expenseId, userId });
        if (payerStatus) {
            await this._expensePayerStatusDao.delete({ expenseId, userId });
        }

        const items = await this._expenseItemDao.getForExpense(expenseId);

        for (const item of items) {
            const userIndex = item.owners.findIndex((o) => o.id === userId);
            if (userIndex !== -1) {
                item.owners.splice(userIndex, 1);
                await this._expenseItemDao.update(item);
            }
        }

        const key = this._userExpenseDao.keyFrom({ expenseId, userId, pendingJoin: false });
        await this._userExpenseDao.delete(key);

        const userExpenses = await this._userExpenseDao.getUsersForExpense(expenseId);
        if (userExpenses.length === 0) {
            // If the last user was deleted, delete the expense as well
            await this._expenseDao.delete({ id: expenseId });
        }

        const childIds = await this._expenseGroupDao.getChildExpenseIds(expenseId);
        if (childIds.length > 0) {
            await Promise.all(childIds.map((cid) => this.removeUserFromExpense(cid, userId)));
        }
    }

    private async addSingleUserToExpense(
        userId: string,
        expenseId: string,
        requestingUserId: string | undefined = undefined,
    ): Promise<void> {
        const writes: TransactWriteItem[] = [];
        if (await this._userExpenseDao.read({ userId, expenseId })) {
            return;
        }

        if (!(await this._expensePayerStatusDao.read({ expenseId, userId }))) {
            writes.push(this._expensePayerStatusDao.putCommand(new ExpensePayerStatus(expenseId, userId, false)));
        }

        if (requestingUserId === undefined && !(await this._expenseGroupDao.getParentExpenseId(expenseId))) {
            // Adding user without a request and no parent, so add a leading expense record for the user for it to be on their expense list
            const expense = await this._expenseDao.read({ id: expenseId });
            writes.push(
                this._leadingExpenseDao.putCommand(new LeadingExpense(userId, expense.transactionDate, expense.id)),
            );
        }

        await this._userExpenseDao.create(
            new UserExpense(expenseId, userId, requestingUserId !== undefined, requestingUserId, new Date(Date.now())),
        );

        await this._transactionStrategy.execute(writes);
    }
}
