import { ILogger, IDynamoDbTransactionStrategy } from "@splitsies/utils";
import { inject, injectable } from "inversify";
import { IUserExpenseDao } from "src/dao/user-expense-dao/user-expense-dao-interface";
import { IUserExpenseStrategy } from "../user-expense-strategy/user-expense-strategy.i";
import { IExpenseWriteStrategy } from "../expense-write-strategy/expense-write-strategy.i";
import { IUserDataStrategy } from "./user-data-strategy.i";
import { IExpenseItemDao } from "src/dao/expense-item-dao/expense-item-dao-interface";
import { ExpensePayerStatus, IExpenseUserDetails } from "@splitsies/shared-models";
import { IExpensePayerDao } from "src/dao/expense-payer-dao/expense-payer-dao-interface";
import { IExpensePayerStatusDao } from "src/dao/expense-payer-status-dao/expense-payer-status-dao-interface";
import { UserExpense } from "src/models/user-expense/user-expense";
import { ExpensePayer } from "src/models/expense-payer/expense-payer";
import { ILeadingExpenseDao } from "src/dao/leading-expense-dao/leading-expense-dao.i";
import { IExpenseDao } from "src/dao/expense-dao/expense-dao-interface";
import { LeadingExpense } from "src/models/leading-expense";

@injectable()
export class UserDataStrategy implements IUserDataStrategy {
    constructor(
        @inject(ILogger) private readonly _logger: ILogger,
        @inject(IExpenseDao) private readonly _expenseDao: IExpenseDao,
        @inject(IUserExpenseDao) private readonly _userExpenseDao: IUserExpenseDao,
        @inject(IExpenseItemDao) private readonly _expenseItemDao: IExpenseItemDao,
        @inject(IExpensePayerDao) private readonly _expensePayerDao: IExpensePayerDao,
        @inject(ILeadingExpenseDao) private readonly _leadingExpenseDao: ILeadingExpenseDao,
        @inject(IExpensePayerStatusDao) private readonly _expensePayerStatusDao: IExpensePayerStatusDao,
        @inject(IDynamoDbTransactionStrategy) private readonly _transactionStrategy: IDynamoDbTransactionStrategy,
        @inject(IUserExpenseStrategy) private readonly _userExpenseStrategy: IUserExpenseStrategy,
        @inject(IExpenseWriteStrategy) private readonly _expenseWriteStrategy: IExpenseWriteStrategy,
    ) { }
    
    async deleteUserData(userId: string): Promise<string[]> {
        this._logger.log(`Deleting user data for ${userId}`);

        const userExpenses = await this._userExpenseDao.getForUser(userId);
        await this._transactionStrategy.runWithSimpleTransaction(async transaction => { 
            const ops: Promise<any>[] = [];
            await Promise.all(userExpenses.map(async ({ expenseId, userId }) => {
                const users = await this._userExpenseDao.getUsersForExpense(expenseId);
                if (users.length > 1) {
                    ops.push(this._userExpenseStrategy.removeUserFromExpense(expenseId, userId, transaction));
                } else {
                    ops.push(this._expenseWriteStrategy.delete(expenseId, transaction));
                }
            }));
            await Promise.all(ops);
        });

        return userExpenses.map(ue => ue.expenseId);
    }

    async replaceGuestUserInfo(guestUserId: string, registeredUser: IExpenseUserDetails): Promise<string[]> {
        const updates: Promise<any>[] = [];
        const updatedExpenseIds: string[] = [];

        this._transactionStrategy.runWithSimpleTransaction(async transaction => {
            // Get user expense records
            const ues = await this._userExpenseDao.getForUser(guestUserId);

            // Replace the existing guest id with registered id
            updates.push(...ues.map((ue) => this._userExpenseDao.delete(this._userExpenseDao.keyFrom(ue), transaction)));
            updates.push(
                ...ues.map((ue) =>
                    this._userExpenseDao.create(
                        new UserExpense(ue.expenseId, registeredUser.id, false, ue.requestingUserId),
                        transaction
                    ),
                ),
            );

            // Replace any old item owners with the new user
            for (const { expenseId } of ues) {
                const expense = await this._expenseDao.read({ id: expenseId });
                if (!expense) continue;

                let updated = false;

                const leadingExpense = await this._leadingExpenseDao.readByValues(guestUserId, expense);
                if (leadingExpense) {
                    updates.push(this._leadingExpenseDao.deleteByValues(guestUserId, expense, transaction));
                    updates.push(this._leadingExpenseDao.create(
                        new LeadingExpense(registeredUser.id, expense.transactionDate, expense.id), transaction
                    ));
                }

                const items = await this._expenseItemDao.getForExpense(expenseId);
                const payer = await this._expensePayerDao.read({ expenseId, userId: guestUserId });
                if (payer) {
                    updated = true;
                    await this._expensePayerDao.delete({ expenseId, userId: guestUserId }, transaction);
                    await this._expensePayerDao.create(new ExpensePayer(expenseId, registeredUser.id, payer.share), transaction);
                }

                const payerStatus = await this._expensePayerStatusDao.read({ expenseId, userId: guestUserId });
                if (payerStatus) {
                    updated = true;
                    await this._expensePayerStatusDao.delete({ expenseId, userId: guestUserId }, transaction);
                    await this._expensePayerStatusDao.create(
                        new ExpensePayerStatus(expenseId, registeredUser.id, payerStatus.settled),
                        transaction
                    );
                }
                for (const item of items) {
                    const idx = item.owners.findIndex((e) => e.id === guestUserId);
                    if (idx === -1) continue;

                    updated = true;
                    item.owners.splice(idx, 1);
                    item.owners.push(registeredUser);
                    updates.push(this._expenseItemDao.update(item, transaction));
                }

                if (updated) updatedExpenseIds.push(expenseId);
            }

            await Promise.all(updates);
        });

        return updatedExpenseIds;
    }
}