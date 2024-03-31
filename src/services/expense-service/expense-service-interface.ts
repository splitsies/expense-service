import {
    IExpenseDto,
    IExpenseItem,
    IExpenseJoinRequest,
    IExpenseUserDetails,
} from "@splitsies/shared-models";
import { IExpenseUpdate } from "src/models/expense-update/expense-update-interface";
import { IUserExpense } from "src/models/user-expense/user-expense-interface";

export interface IExpenseService {
    getExpense(id: string): Promise<IExpenseDto>;
    getUserExpense(userId: string, expenseId: string): Promise<IUserExpense>;
    createExpense(userId: string): Promise<IExpenseDto>;
    createExpenseFromScan(expense: IExpenseDto, userId: string): Promise<IExpenseDto>;
    updateExpense(id: string, updated: IExpenseDto): Promise<IExpenseDto>;
    getExpensesForUser(userId: string): Promise<IExpenseDto[]>;
    getUsersForExpense(expenseId: string): Promise<string[]>;
    addUserToExpense(userId: string, expenseId: string, requestingUserId: string): Promise<void>;
    removeUserFromExpense(expenseId: string, userId: string): Promise<IExpenseDto>;
    getExpenseJoinRequestsForUser(userId: string): Promise<IExpenseJoinRequest[]>;
    addExpenseJoinRequest(userId: string, expenseId: string, requestUserId: string): Promise<void>;
    removeExpenseJoinRequest(userId: string, expenseId: string, requestingUserId: string): Promise<void>;
    getJoinRequestsForExpense(expenseId: string): Promise<IExpenseJoinRequest[]>;
    addExpenseItem(
        name: string,
        price: number,
        owners: IExpenseUserDetails[],
        isProportional: boolean,
        expenseId: string,
    ): Promise<IExpenseDto>;
    removeExpenseItem(itemId: string, expenseId: string): Promise<IExpenseDto>;
    getExpenseItems(expenseId: string): Promise<IExpenseItem[]>;
    saveUpdatedItems(updatedItems: IExpenseItem[]): Promise<IExpenseItem[]>;
    replaceGuestUserInfo(guestUserId: string, registeredUser: IExpenseUserDetails): Promise<IExpenseDto[]>;
    queueExpenseUpdate(expenseUpdate: IExpenseUpdate): Promise<void>;
    deleteExpenseUpdates(expenseUpdates: IExpenseUpdate[]): Promise<void>;
}

export const IExpenseService: symbol = Symbol.for("IExpenseService");
