import { ExpensePayerStatus, IExpenseDto } from "@splitsies/shared-models";
import { IDynamoDbTransactionStrategy, ILogger } from "@splitsies/utils";
import { randomUUID } from "crypto";
import { inject, injectable } from "inversify";
import { IExpenseDao } from "src/dao/expense-dao/expense-dao-interface";
import { IExpenseItemDao } from "src/dao/expense-item-dao/expense-item-dao-interface";
import { IExpensePayerDao } from "src/dao/expense-payer-dao/expense-payer-dao-interface";
import { IExpensePayerStatusDao } from "src/dao/expense-payer-status-dao/expense-payer-status-dao-interface";
import { IUserExpenseDao } from "src/dao/user-expense-dao/user-expense-dao-interface";
import { ExpensePayer } from "src/models/expense-payer/expense-payer";
import { IExpenseWriteStrategy } from "./expense-write-strategy.i";
import { ILeadingExpenseDao } from "src/dao/leading-expense-dao/leading-expense-dao.i";
import { LeadingExpense } from "src/models/leading-expense";
import { UserExpense } from "src/models/user-expense/user-expense";
import { IExpenseGroupDao } from "src/dao/expense-group-dao/expense-group-dao-interface";
import { Expense } from "src/models/expense";

@injectable()
export class ExpenseWriteStrategy implements IExpenseWriteStrategy {
    constructor(
        @inject(ILogger) private readonly _logger: ILogger,
        @inject(IExpenseDao) private readonly _expenseDao: IExpenseDao,
        @inject(IExpensePayerDao) private readonly _expensePayerDao: IExpensePayerDao,
        @inject(IUserExpenseDao) private readonly _userExpenseDao: IUserExpenseDao,
        @inject(IExpensePayerStatusDao) private readonly _expensePayerStatusDao: IExpensePayerStatusDao,
        @inject(IExpenseItemDao) private readonly _expenseItemDao: IExpenseItemDao,
        @inject(IExpenseGroupDao) private readonly _expenseGroupDao: IExpenseGroupDao,
        @inject(ILeadingExpenseDao) private readonly _leadingExpenseDao: ILeadingExpenseDao,
        @inject(IDynamoDbTransactionStrategy) private readonly _transactionStrategy: IDynamoDbTransactionStrategy,
    ) {}

    async updateTransactionDate(id: string, newTransactionDate: Date): Promise<void> {
        const expense = await this._expenseDao.read({ id });
        const userIds = await this._userExpenseDao.getUsersForExpense(id);

        await this._transactionStrategy.runWithSimpleTransaction(async (success) => {
            const ops: Promise<any>[] = [];

            ops.push(this._expenseDao.update(new Expense(expense.id, expense.name, newTransactionDate), success));

            if (!(await this._expenseGroupDao.getParentExpenseId(id))) {
                for (const userId of userIds) {
                    const leadingExpenseRecord = await this._leadingExpenseDao.readByValues(userId, expense);
                    if (!leadingExpenseRecord) return;

                    ops.push(this._leadingExpenseDao.deleteByValues(userId, expense, success));
                    ops.push(
                        this._leadingExpenseDao.create(
                            new LeadingExpense(userId, newTransactionDate, expense.id),
                            success,
                        ),
                    );
                }
            }

            await Promise.all(ops);
        });
    }

    async delete(id: string, parentTransaction: Promise<boolean> | undefined = undefined): Promise<void> {
        const expense = await this._expenseDao.read({ id });
        const userIds = await this._userExpenseDao.getUsersForExpense(id);

        const transaction = async (success: Promise<boolean>) => {
            const ops: Promise<any>[] = [];

            const payers = await this._expensePayerDao.getForExpense(id);
            const payerStatuses = await this._expensePayerStatusDao.getForExpense(id);
            const items = await this._expenseItemDao.getForExpense(id);
            const children = await this._expenseGroupDao.getChildExpenseIds(id);
            const parentExpenseId = await this._expenseGroupDao.getParentExpenseId(id);

            ops.push(
                ...items.map((i) => this._expenseItemDao.delete({ expenseId: id, id: i.id }, success)),
                ...payerStatuses.map((p) =>
                    this._expensePayerDao.delete({ userId: p.userId, expenseId: p.expenseId }, success),
                ),
                ...payers.map((p) =>
                    this._expensePayerDao.delete({ userId: p.userId, expenseId: p.expenseId }, success),
                ),
                ...children.flatMap((child) => [
                    this._expenseGroupDao.delete({ parentExpenseId: id, childExpenseId: child }, success),
                    this.delete(child, success),
                ]),
                ...userIds.flatMap((userId) => [
                    this._leadingExpenseDao.deleteByValues(userId, expense, success),
                    this._userExpenseDao.delete({ userId, expenseId: id }, success),
                ]),
            );

            await Promise.all(ops);
            await this._expenseDao.delete({ id }, success);
            if (parentExpenseId) {
                await this._expenseGroupDao.delete({ parentExpenseId, childExpenseId: id }, success);
            }
        };

        await (parentTransaction !== undefined
            ? transaction(parentTransaction)
            : this._transactionStrategy.runWithSimpleTransaction(transaction));
    }

    async create(userId: string, dto: IExpenseDto | undefined = undefined): Promise<Expense> {
        const id = randomUUID();
        const transactionDate = dto ? new Date(dto.transactionDate) : new Date();

        await this._transactionStrategy.runWithSimpleTransaction(async (success) => {
            const operations: Promise<any>[] = [];
            operations.push(
                this._expenseDao.create(new Expense(id, dto?.name ?? "Untitled", transactionDate), success),
            );
            operations.push(
                ...(dto?.items ?? []).map((i) => this._expenseItemDao.create({ ...i, expenseId: id }, success)),
            );
            operations.push(this._leadingExpenseDao.create(new LeadingExpense(userId, transactionDate, id), success));
            operations.push(this._userExpenseDao.create(new UserExpense(id, userId, false), success));
            operations.push(this._expensePayerDao.create(new ExpensePayer(id, userId, 1), success));
            operations.push(this._expensePayerStatusDao.create(new ExpensePayerStatus(id, userId, false), success));
            await Promise.all(operations);
        });

        return this._expenseDao.read({ id });
    }
}
