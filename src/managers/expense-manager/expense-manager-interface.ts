import {
    IExpenseDto,
    IExpenseItem,
    IExpenseJoinRequest,
    IExpenseUserDetails,
    IQueueMessage,
    IScanResult,
} from "@splitsies/shared-models";
import { IUserExpenseDto } from "src/models/user-expense-dto/user-expense-dto-interface";
import { IUserExpense } from "src/models/user-expense/user-expense-interface";

export interface IExpenseManager {
    getUserExpense(userId: string, expenseId: string): Promise<IUserExpense>;
    getExpense(id: string): Promise<IExpenseDto>;
    createExpense(userId: string): Promise<IExpenseDto>;
    createExpenseFromScan(expense: IExpenseDto, userId: string): Promise<IExpenseDto>;
    updateExpense(id: string, updated: IExpenseDto): Promise<IExpenseDto>;
    getExpensesForUser(userId: string, limit: number, offset: number): Promise<IScanResult<IExpenseDto>>;
    getUsersForExpense(expenseId: string): Promise<string[]>;
    addUserToExpense(userId: string, expenseId: string, requestingUserId: string): Promise<void>;
    removeUserFromExpense(expenseId: string, userId: string): Promise<IExpenseDto>;
    getExpenseJoinRequestsForUser(userId: string): Promise<IUserExpenseDto[]>;
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
    queueExpenseUpdate(expenseUpdate: IExpenseDto): Promise<void>;
    deleteUserData(userId: string): Promise<string[]>;
}

export const IExpenseManager = Symbol.for("IExpenseManager");
