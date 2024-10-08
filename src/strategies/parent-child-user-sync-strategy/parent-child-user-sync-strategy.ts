import { inject, injectable } from "inversify";
import { IParentChildUserSyncStrategy } from "./parent-child-user-sync-strategy.i";
import { IUserExpenseDao } from "src/dao/user-expense-dao/user-expense-dao-interface";
import { IExpenseGroupDao } from "src/dao/expense-group-dao/expense-group-dao-interface";
import { IUserExpenseStrategy } from "../user-expense-strategy/user-expense-strategy.i";
import { IDynamoDbTransactionStrategy } from "@splitsies/utils";

@injectable()
export class ParentChildUserSyncStrategy implements IParentChildUserSyncStrategy {
    constructor(
        @inject(IExpenseGroupDao) private readonly _expenseGroupDao: IExpenseGroupDao,
        @inject(IUserExpenseDao) private readonly _userExpenseDao: IUserExpenseDao,
        @inject(IUserExpenseStrategy) private readonly _userExpenseStrategy: IUserExpenseStrategy,
        @inject(IDynamoDbTransactionStrategy) private readonly _transactionStrategy: IDynamoDbTransactionStrategy,
    ) {}

    async sync(parentExpenseId: string, transaction: Promise<boolean> | undefined = undefined): Promise<void> {
        const users = await this._userExpenseDao.getUsersForExpense(parentExpenseId);
        const childIds = await this._expenseGroupDao.getChildExpenseIds(parentExpenseId);

        const transact = async (success: Promise<boolean>) => {
            const promises: Promise<void>[] = [];

            // Add each of the parent's users to each child
            promises.push(
                ...childIds.flatMap((childId) =>
                    users.map((userId) => this._userExpenseStrategy.addUserToExpense(userId, childId, false, success)),
                ),
            );

            // Add each of each child's users to the parent
            promises.push(
                ...childIds.map(async (childId) => {
                    const userIds = await this._userExpenseDao.getUsersForExpense(childId);
                    await Promise.all(
                        userIds.map((userId) =>
                            this._userExpenseStrategy.addUserToExpense(userId, parentExpenseId, false, success),
                        ),
                    );
                }),
            );

            await Promise.all(promises);
        };

        await (transaction !== undefined
            ? transact(transaction)
            : this._transactionStrategy.runWithSimpleTransaction(transact));
    }
}
