import {
    IExpenseDto,
    IExpenseItem,
    IExpenseJoinRequest,
    IExpenseUserDetails,
    IPayerShare,
    IScanResult,
} from "@splitsies/shared-models";
import { IUserExpenseDto } from "src/models/user-expense-dto/user-expense-dto-interface";
import { IUserExpense } from "src/models/user-expense/user-expense-interface";

export interface IExpenseManager {
    getUserExpense(userId: string, expenseId: string): Promise<IUserExpense>;
    getExpense(id: string): Promise<IExpenseDto>;
    createExpense(userId: string): Promise<IExpenseDto>;
    createExpenseFromScan(expense: IExpenseDto, userId: string): Promise<IExpenseDto>;
    deleteExpense(id: string): Promise<void>;
    addNewExpenseToGroup(
        parentExpenseId: string,
        userId: string,
        childExpense?: IExpenseDto | undefined,
    ): Promise<IExpenseDto>;
    addExistingExpenseToGroup(groupExpenseId: string, childExpenseId: string): Promise<void>;
    removeExpenseFromGroup(groupExpenseId: string, childExpenseId: string): Promise<void>;
    updateExpense(id: string, updated: IExpenseDto): Promise<IExpenseDto>;
    getExpensesForUser(
        userId: string,
        limit: number,
        offset?: Record<string, object>,
    ): Promise<IScanResult<IExpenseDto>>;
    getUsersForExpense(expenseId: string): Promise<string[]>;
    addUserToExpense(userId: string, expenseId: string): Promise<void>;
    removeUserFromExpense(expenseId: string, userId: string): Promise<IExpenseDto>;
    getExpenseJoinRequestsForUser(
        userId: string,
        limit: number,
        offset?: Record<string, object>,
    ): Promise<IScanResult<IUserExpenseDto>>;
    getJoinRequestCountForUser(userId: string): Promise<number>;
    addExpenseJoinRequest(userId: string, expenseId: string, requestUserId: string): Promise<void>;
    removeExpenseJoinRequest(userId: string, expenseId: string): Promise<void>;
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
    setExpensePayers(expenseId: string, payerShares: IPayerShare[]): Promise<IExpenseDto>;
    setExpensePayerStatus(expenseId: string, userId: string, settled: boolean): Promise<IExpenseDto>;
    getLeadingExpenseId(expenseId: string): Promise<string>;
    updateExpenseTransactionDate(expenseId: string, transactionDate: Date): Promise<IExpenseDto>;
}

export const IExpenseManager = Symbol.for("IExpenseManager");
