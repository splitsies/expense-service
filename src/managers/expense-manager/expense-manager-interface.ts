import { IExpense, IExpenseItem, IExpenseJoinRequest, IExpenseUpdate, IExpenseUserDetails } from "@splitsies/shared-models";
import { IUserExpense } from "src/models/user-expense/user-expense-interface";

export interface IExpenseManager {
    getUserExpense(userId: string, expenseId: string): Promise<IUserExpense>;
    getExpense(id: string): Promise<IExpense>;
    createExpense(userId: string): Promise<IExpense>;
    createExpenseFromImage(expense: IExpense, userId: string): Promise<IExpense>;
    updateExpense(id: string, updated: IExpenseUpdate): Promise<IExpense>;
    getExpensesForUser(userId: string): Promise<IExpense[]>;
    getUsersForExpense(expenseId: string): Promise<string[]>;
    addUserToExpense(userId: string, expenseId: string, requestingUserId: string): Promise<void>;
    removeUserFromExpense(expenseId: string, userId: string): Promise<IExpense>;
    getExpenseJoinRequestsForUser(userId: string): Promise<IExpenseJoinRequest[]>;
    addExpenseJoinRequest(userId: string, expenseId: string, requestUserId: string): Promise<void>;
    removeExpenseJoinRequest(userId: string, expenseId: string, requestingUserId: string): Promise<void>;
    getJoinRequestsForExpense(expenseId: string): Promise<IExpenseJoinRequest[]>;
    joinRequestExists(userId: string, expenseId: string): Promise<boolean>;
    addExpenseItem(
        name: string,
        price: number,
        owners: IExpenseUserDetails[],
        isProportional: boolean,
        expenseId: string,
    ): Promise<IExpense>;
    removeExpenseItem(itemId: string, expenseId: string): Promise<IExpense>;
    getExpenseItems(expenseId: string): Promise<IExpenseItem[]>;
    saveUpdatedItems(updatedItems: IExpenseItem[]): Promise<IExpenseItem[]>;
    replaceGuestUserInfo(guestUserId: string, registeredUser: IExpenseUserDetails): Promise<IExpense[]>;
}

export const IExpenseManager = Symbol.for("IExpenseManager");
