import { ExpensePayerStatus, IExpenseDto } from "@splitsies/shared-models";
import { ILogger } from "@splitsies/utils";
import { randomUUID } from "crypto";
import { inject, injectable } from "inversify";
import { IExpenseDao } from "src/dao/expense-dao/expense-dao-interface";
import { IExpenseItemDao } from "src/dao/expense-item-dao/expense-item-dao-interface";
import { IExpensePayerDao } from "src/dao/expense-payer-dao/expense-payer-dao-interface";
import { IExpensePayerStatusDao } from "src/dao/expense-payer-status-dao/expense-payer-status-dao-interface";
import { IUserExpenseDao } from "src/dao/user-expense-dao/user-expense-dao-interface";
import { ExpensePayer } from "src/models/expense-payer/expense-payer";
import { ExpenseDa } from "src/models/expense/expense-da";
import { IExpenseDa } from "src/models/expense/expense-da-interface";
import { IExpenseWriteStrategy } from "./expense-write-strategy.i";
import { IExpenseGroupDao } from "src/dao/expense-group-dao/expense-group-dao-interface";
import { ILeadingExpenseDao } from "src/dao/leading-expense-dao/leading-expense-dao.i";
import { LeadingExpense } from "src/models/leading-expense";
import { UserExpense } from "src/models/user-expense/user-expense";

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
        @inject(ILeadingExpenseDao) private readonly _leadingExpenseDao: ILeadingExpenseDao
    ) { }
    
    async updateTransactionDate(id: string, newTransactionDate: Date): Promise<void> {
        const expense = await this._expenseDao.read({ id });
        const userIds = await this._userExpenseDao.getUsersForExpense(id);

        await Promise.all(userIds.map(async userId => {
            const key = this._leadingExpenseDao.keyFrom(new LeadingExpense(userId, expense.transactionDate, expense.id));
            const leadingExpenseRecord = await this._leadingExpenseDao.read(key);
            if (!leadingExpenseRecord) return;

            await this._leadingExpenseDao.delete(key);
            await this._leadingExpenseDao.create(new LeadingExpense(userId, newTransactionDate, expense.id));
        }));
    }

    async delete(id: string): Promise<void> {
        const expense = await this._expenseDao.read({ id });
        const userIds = await this._userExpenseDao.getUsersForExpense(id);

        await Promise.all(userIds.map(async userId => {
            await this._leadingExpenseDao.delete(this._leadingExpenseDao.keyFrom(new LeadingExpense(userId, expense.transactionDate, expense.id)));        
            await this._userExpenseDao.delete({ userId, expenseId: id });
        }));

        const payers = await this._expensePayerDao.getForExpense(id);
        const payerStatuses = await this._expensePayerStatusDao.getForExpense(id);
        const items = await this._expenseItemDao.getForExpense(id);

        await Promise.all([
            ...items.map((i) => this._expenseItemDao.delete({ expenseId: id, id: i.id })),
            ...payerStatuses.map((p) => this._expensePayerDao.delete({ userId: p.userId, expenseId: p.expenseId })),
            ...payers.map((p) => this._expensePayerDao.delete({ userId: p.userId, expenseId: p.expenseId })),
        ]);

        const children = await this._expenseGroupDao.getChildExpenseIds(id);
        if (children.length) {
            for (const child of children) {
                await this._expenseGroupDao.delete({ parentExpenseId: id, childExpenseId: child });
                await this.delete(child);
            }
        }

        const parentExpenseId = await this._expenseGroupDao.getParentExpenseId(id);

        if (parentExpenseId) {
            await this._expenseGroupDao.delete({ parentExpenseId, childExpenseId: id });
        }

        await this._expenseDao.delete({ id });
    }

    async create(userId: string, dto: IExpenseDto | undefined = undefined): Promise<IExpenseDa> {
        const id = randomUUID();

        const created = dto
            ? await this._expenseDao.create(new ExpenseDa(id, dto.name, new Date(dto.transactionDate)))
            : await this._expenseDao.create(new ExpenseDa(id, "Untitled", new Date()));

        if (dto) {
            await Promise.all(
                dto.items.map((i) => this._expenseItemDao
                    .create({ ...i, expenseId: id })
                    .catch((e) => this._logger.error(`Error creating expense item ${i.id} - ${i.name}`, e))
                ),
            );
        }

        await Promise.all([
            this._leadingExpenseDao.create(new LeadingExpense(userId, created.transactionDate, created.id)),
            this._userExpenseDao.create(new UserExpense(created.id, userId, false)),
            this._expensePayerDao.create(new ExpensePayer(id, userId, 1)),
            this._expensePayerStatusDao.create(new ExpensePayerStatus(id, userId, false)),
        ]);

        return created;
    }
}
