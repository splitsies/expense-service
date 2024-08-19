import {
    ExpenseMessage,
    ExpenseOperation,
    IExpenseDto,
    IExpenseItem,
    IExpenseMessageParameters,
    IExpenseUserDetails,
    ExpenseMessageType,
    ExpenseItemSelectionUpdate,
    ExpenseItemDetailsUpdate,
} from "@splitsies/shared-models";
import { IExpenseMessageStrategy } from "./expense-message-strategy-interface";
import { inject, injectable } from "inversify";
import { IExpenseService } from "src/services/expense-service/expense-service-interface";

@injectable()
export class ExpenseMessageStrategy implements IExpenseMessageStrategy {
    constructor(@inject(IExpenseService) private readonly _expenseService: IExpenseService) {}

    async execute(operationName: ExpenseOperation, params: IExpenseMessageParameters): Promise<ExpenseMessage> {
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
            case "updateSingleItemSelected":
                return this.updateSingleItemSelected(
                    params.expenseId,
                    params.user,
                    params.item.id,
                    params.itemSelected,
                );
        }
    }

    private async addItem(
        expenseId: string,
        name: string,
        price: number,
        owners: IExpenseUserDetails[],
        isProportional: boolean,
    ): Promise<ExpenseMessage> {
        await this._expenseService.addExpenseItem(name, price, owners, isProportional, expenseId);

        const expense = await this._expenseService.getLeadingExpense(expenseId);
        return new ExpenseMessage({
            type: ExpenseMessageType.ExpenseDto,
            connectedExpenseId: expense.id,
            expenseDto: expense,
        });
    }

    private async removeItem(expenseId: string, item: IExpenseItem): Promise<ExpenseMessage> {
        await this._expenseService.removeExpenseItem(item.id, expenseId);

        const expense = await this._expenseService.getLeadingExpense(expenseId);
        return new ExpenseMessage({
            type: ExpenseMessageType.ExpenseDto,
            connectedExpenseId: expense.id,
            expenseDto: expense,
        });
    }

    private async updateItemSelections(
        expenseId: string,
        user: IExpenseUserDetails,
        selectedItemIds: string[],
    ): Promise<ExpenseMessage> {
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
        
        const expense = await this._expenseService.getLeadingExpense(expenseId);
        return new ExpenseMessage({
            type: ExpenseMessageType.ExpenseDto,
            connectedExpenseId: expense.id,
            expenseDto: expense,
        });
    }

    private async updateSingleItemSelected(
        expenseId: string,
        user: IExpenseUserDetails,
        itemId: string,
        selected: boolean,
    ): Promise<ExpenseMessage> {
        const expenseItems = await this._expenseService.getExpenseItems(expenseId);
        const targetItem = expenseItems.find((i) => i.id === itemId);
        if (selected && !targetItem.owners.find((o) => o.id === user.id)) {
            targetItem.owners.push(user);
        } else if (!selected) {
            const index = targetItem.owners.findIndex((o) => o.id === user.id);
            if (index !== -1) {
                targetItem.owners.splice(index, 1);
            }
        }

        await this._expenseService.saveUpdatedItems([targetItem]);

        return new ExpenseMessage({
            type: ExpenseMessageType.ItemSelection,
            connectedExpenseId: await this._expenseService.getLeadingExpenseId(expenseId),
            itemSelectionUpdate: new ExpenseItemSelectionUpdate(expenseId, itemId, user.id, selected)
        });
    }

    private async updateItemDetails(
        expenseId: string,
        itemId: string,
        name: string,
        price: number,
        isProportional: boolean,
    ): Promise<ExpenseMessage> {
        const expenseItems = await this._expenseService.getExpenseItems(expenseId);
        const itemIndex = expenseItems.findIndex((i) => i.id === itemId);
        if (itemIndex === -1) throw new Error("Item not found for expense");

        const updatedItem = { ...expenseItems[itemIndex], name, price, isProportional };
        await this._expenseService.saveUpdatedItems([updatedItem]);

        return new ExpenseMessage({
            type: ExpenseMessageType.ItemDetails,
            connectedExpenseId: await this._expenseService.getLeadingExpenseId(expenseId),
            itemDetailsUpdate: new ExpenseItemDetailsUpdate(expenseId, updatedItem)
        });
    }

    private async updateExpenseName(expenseId: string, expenseName: string): Promise<ExpenseMessage> {
        return this.updateExpense(expenseId, (e) => ({ ...e, name: expenseName } as IExpenseDto));
    }

    private async updateExpenseTransactionDate(expenseId: string, transactionDate: Date): Promise<ExpenseMessage> {
        return this.updateExpense(
            expenseId,
            (e) => ({ ...e, transactionDate: transactionDate.toISOString() } as IExpenseDto),
        );
    }

    private async updateExpense(
        expenseId: string,
        update: (expense: IExpenseDto) => IExpenseDto,
    ): Promise<ExpenseMessage> {
        const expense = await this._expenseService.getExpense(expenseId);
        const updated = update(expense);
        await this._expenseService.updateExpense(expense.id, updated);

        const updatedExpense = await this._expenseService.getLeadingExpense(expenseId);
        return new ExpenseMessage({
            type: ExpenseMessageType.ExpenseDto,
            connectedExpenseId: expense.id,
            expenseDto: updatedExpense,
        });
    }
}
