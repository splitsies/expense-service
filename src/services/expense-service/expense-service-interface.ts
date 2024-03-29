import {
    IExpenseDto,
    IExpenseItem,
    IExpenseJoinRequest,
    IExpenseJoinRequestDto,
    IExpenseUserDetails,
} from "@splitsies/shared-models";
import { IUserExpense } from "src/models/user-expense/user-expense-interface";

export interface IExpenseService {
    getExpense(id: string): Promise<IExpenseDto>;
    getUserExpense(userId: string, expenseId: string): Promise<IUserExpense>;
    createExpense(userId: string): Promise<IExpenseDto>;
    createExpenseFromImage(base64Image: string, userId: string): Promise<IExpenseDto>;
    updateExpense(id: string, updated: IExpenseDto): Promise<IExpenseDto>;
    getExpensesForUser(userId: string): Promise<IExpenseDto[]>;
    getUsersForExpense(expenseId: string): Promise<string[]>;
    addUserToExpense(userId: string, expenseId: string, requestingUserId: string): Promise<void>;
    removeUserFromExpense(expenseId: string, userId: string): Promise<IExpenseDto>;
    getExpenseUserDetailsForExpenses(expenseIds: string[]): Promise<Map<string, IExpenseUserDetails[]>>;
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
    ): Promise<IExpense>;
    removeExpenseItem(itemId: string, expenseId: string): Promise<IExpenseDto>;
    getExpenseItems(expenseId: string): Promise<IExpenseItem[]>;
    saveUpdatedItems(updatedItems: IExpenseItem[]): Promise<IExpenseItem[]>;
    replaceGuestUserInfo(guestUserId: string, registeredUser: IExpenseUserDetails): Promise<IExpenseDto[]>;
}

export const IExpenseService: symbol = Symbol.for("IExpenseService");
