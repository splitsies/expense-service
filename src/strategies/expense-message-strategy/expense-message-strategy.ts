import {
    ExpenseOperation,
    IExpense,
    IExpenseItem,
    IExpenseMessageParameters,
    IExpenseUpdateMapper,
    IExpenseUserDetails,
} from "@splitsies/shared-models";
import { IExpenseMessageStrategy } from "./expense-message-strategy-interface";
import { inject, injectable } from "inversify";
import { IExpenseService } from "src/services/expense-service/expense-service-interface";

@injectable()
export class ExpenseMessageStrategy implements IExpenseMessageStrategy {
    constructor(
        @inject(IExpenseService) private readonly _expenseService: IExpenseService,
        @inject(IExpenseUpdateMapper) private readonly _expenseUpdateMapper: IExpenseUpdateMapper,
    ) {}

    async execute(operationName: ExpenseOperation, params: IExpenseMessageParameters): Promise<IExpense> {
        switch (operationName) {
            case "addItem":
                return this.addItem(
                    params.expenseId,
                    params.itemName,
                    params.itemPrice,
                    params.itemOwners,
                    params.isItemProportional,
                );
            case "removeItem":
                return this.removeItem(params.expenseId, params.item);
            case "updateItemSelections":
                return this.updateItemSelections(params.expenseId, params.user, params.selectedItemIds);
            case "updateItemDetails":
                return this.updateItemDetails(
                    params.expenseId,
                    params.item.id,
                    params.itemName,
                    params.itemPrice,
                    params.isItemProportional,
                );
            case "updateExpenseName":
                return this.updateExpenseName(params.expenseId, params.expenseName);
            case "updateTransactionDate":
                return this.updateExpenseTransactionDate(params.expenseId, params.transactionDate);
        }
    }

    private async addItem(
        expenseId: string,
        name: string,
        price: number,
        owners: IExpenseUserDetails[],
        isProportional: boolean,
    ): Promise<IExpense> {
        return this._expenseService.addExpenseItem(name, price, owners, isProportional, expenseId);
    }

    private async removeItem(expenseId: string, item: IExpenseItem): Promise<IExpense> {
        return await this._expenseService.removeExpenseItem(item.id, expenseId);
    }

    private async updateItemSelections(
        expenseId: string,
        user: IExpenseUserDetails,
        selectedItemIds: string[],
    ): Promise<IExpense> {
        const expenseItems = await this._expenseService.getExpenseItems(expenseId);
        const updated: IExpenseItem[] = [];

        for (const item of expenseItems) {
            const itemSelected = selectedItemIds.includes(item.id);
            const userOwnsItem = !!item.owners.find((o) => o.id === user.id);

            if (itemSelected && !userOwnsItem) {
                item.owners.push(user);
            } else if (!itemSelected && userOwnsItem) {
                const index = item.owners.findIndex((o) => o.id === user.id);
                if (index !== -1) item.owners.splice(index, 1);
            } else {
                continue;
            }

            updated.push(item);
        }
        
        await this._expenseService.saveUpdatedItems(updated);
        return this._expenseService.getExpense(expenseId);
    }

    private async updateItemDetails(
        expenseId: string,
        itemId: string,
        name: string,
        price: number,
        isProportional: boolean,
    ): Promise<IExpense> {
        const expenseItems = await this._expenseService.getExpenseItems(expenseId);
        const itemIndex = expenseItems.findIndex((i) => i.id === itemId);
        if (itemIndex === -1) throw new Error("Item not found for expense");

        const updatedItem = { ...expenseItems[itemIndex], name, price, isProportional };
        await this._expenseService.saveUpdatedItems([updatedItem]);
        return this._expenseService.getExpense(expenseId);
    }

    private async updateExpenseName(expenseId: string, expenseName: string): Promise<IExpense> {
        return this.updateExpense(expenseId, (e) => {
            const expense = { ...e, name: expenseName } as IExpense;
            return expense;
        });
    }

    private async updateExpenseTransactionDate(expenseId: string, transactionDate: Date): Promise<IExpense> {
        return this.updateExpense(expenseId, (e) => {
            const expense = { ...e, transactionDate } as IExpense;
            return expense;
        });
    }

    private async updateExpense(expenseId: string, update: (expense: IExpense) => IExpense): Promise<IExpense> {
        const expense = await this._expenseService.getExpense(expenseId);
        return this._expenseService.updateExpense(expense.id, this._expenseUpdateMapper.toDtoModel(update(expense)));
    }
}
