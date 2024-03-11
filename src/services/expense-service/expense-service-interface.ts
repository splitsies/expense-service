import {
    IExpense,
    IExpenseJoinRequest,
    IExpenseJoinRequestDto,
    IExpensePayload,
    IExpenseUpdate,
    IExpenseUserDetails,
} from "@splitsies/shared-models";
import { IUserExpense } from "src/models/user-expense/user-expense-interface";

export interface IExpenseService {
    getExpense(id: string): Promise<IExpense>;
    getUserExpense(userId: string, expenseId: string): Promise<IUserExpense>;
    createExpense(userId: string): Promise<IExpense>;
    createExpenseFromImage(base64Image: string, userId: string): Promise<IExpense>;
    updateExpense(id: string, updated: IExpenseUpdate): Promise<IExpense>;
    getExpensesForUser(userId: string): Promise<IExpense[]>;
    getUsersForExpense(expenseId: string): Promise<string[]>;
    addUserToExpense(userExpense: IUserExpense, requestingUserId: string): Promise<void>;
    removeUserFromExpense(expenseId: string, userId: string): Promise<IExpense>;
    getExpenseUserDetailsForExpense(expenseId: string): Promise<IExpenseUserDetails[]>;
    getExpenseJoinRequestsForUser(userId: string): Promise<IExpenseJoinRequestDto[]>;
    addExpenseJoinRequest(userId: string, expenseId: string, requestUserId: string): Promise<void>;
    removeExpenseJoinRequest(userId: string, expenseId: string, requestingUserId: string): Promise<void>;
    getJoinRequestsForExpense(expenseId: string): Promise<IExpenseJoinRequest[]>;
    addItemToExpense(
        name: string,
        price: number,
        owners: IExpenseUserDetails[],
        isProportional: boolean,
        expenseId: string,
    ): Promise<IExpense>;
    replaceGuestUserInfo(guestUserId: string, registeredUser: IExpenseUserDetails): Promise<IExpensePayload[]>;
}

export const IExpenseService: symbol = Symbol.for("IExpenseService");
