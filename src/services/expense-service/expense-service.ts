import { inject, injectable } from "inversify";
import {
    IExpenseDto,
    IExpenseItem,
    IExpenseJoinRequest,
    IExpenseUserDetails,
    IExpenseUserDetailsMapper,
    NotFoundError,
} from "@splitsies/shared-models";
import { IExpenseService } from "./expense-service-interface";
import { IAlgorithmsApiClient } from "src/api/algorithms-api-client/algorithms-api-client-interface";
import { ImageProcessingError } from "src/models/error/image-processing-error";
import { ILogger } from "@splitsies/utils";
import { IExpenseManager } from "src/managers/expense-manager/expense-manager-interface";
import { IOcrApiClient } from "src/api/ocr-api-client/ocr-api-client-interface";
import { IUserExpense } from "src/models/user-expense/user-expense-interface";
import { IUsersApiClient } from "src/api/users-api-client/users-api-client-interface";
import { ApiCommunicationError } from "src/models/error/api-communication-error";

@injectable()
export class ExpenseService implements IExpenseService {
    constructor(
        @inject(ILogger) private readonly _logger: ILogger,
        @inject(IExpenseManager) private readonly _expenseManager: IExpenseManager,
        @inject(IOcrApiClient) private readonly _ocrApiClient: IOcrApiClient,
        @inject(IAlgorithmsApiClient) private readonly _algorithsmApiClient: IAlgorithmsApiClient,
        @inject(IUsersApiClient) private readonly _usersApiClient: IUsersApiClient,
        @inject(IExpenseUserDetailsMapper) private readonly _expenseUserDetailsMapper: IExpenseUserDetailsMapper,
    ) {}

    async getUserExpense(userId: string, expenseId: string): Promise<IUserExpense> {
        return this._expenseManager.getUserExpense(userId, expenseId);
    }

    async getExpense(id: string): Promise<IExpenseDto> {
        return this._expenseManager.getExpense(id);
    }

    async createExpense(userId: string): Promise<IExpenseDto> {
        const user = await this._usersApiClient.getById(userId);
        if (!user.data) throw new NotFoundError("User could not be found");
        return await this._expenseManager.createExpense(user.data.id);
    }

    async createExpenseFromImage(base64Image: string, userId: string): Promise<IExpenseDto> {
        const user = await this._usersApiClient.getById(userId);
        if (!user.data) throw new NotFoundError("User could not be found");

        const ocrResult = await this._ocrApiClient.processImage(base64Image);
        this._logger.verbose({ ocrResult });

        const expenseResult = await this._algorithsmApiClient.processImage(ocrResult.data);
        if (!expenseResult.success) throw new ImageProcessingError("Could not create expense from image");

        return this._expenseManager.createExpenseFromImage(
            expenseResult.data,
            user.data.id,
        );
    }

    async updateExpense(id: string, updated: IExpenseDto): Promise<IExpenseDto> {
        return await this._expenseManager.updateExpense(id, updated);
    }

    async getExpensesForUser(userId: string): Promise<IExpenseDto[]> {
        return await this._expenseManager.getExpensesForUser(userId);
    }

    async getUsersForExpense(expenseId: string): Promise<string[]> {
        return await this._expenseManager.getUsersForExpense(expenseId);
    }

    async getExpenseUserDetailsForExpenses(expenseIds: string[]): Promise<Map<string, IExpenseUserDetails[]>> {
        const userIds = new Set<string>();
        const usersIdsForExpenseId = new Map<string, string[]>();
        const usersForExpenseId = new Map<string, IExpenseUserDetails[]>();

        for (const expenseId of expenseIds) {
            const ids = await this.getUsersForExpense(expenseId);
            ids.forEach((id) => userIds.add(id));
            usersIdsForExpenseId.set(expenseId, ids);
        }

        try {
            const response = await this._usersApiClient.findUsersById(Array.from(userIds));
            if (!response.success) throw new Error(`${response.data}`);

            const userDetails = response.data.map((u) => this._expenseUserDetailsMapper.fromUserDto(u));

            for (const [expenseId, ids] of usersIdsForExpenseId) {
                usersForExpenseId.set(
                    expenseId,
                    userDetails.filter((ud) => ids.includes(ud.id)),
                );
            }

            return usersForExpenseId;
        } catch (e) {
            this._logger.error(e);
            throw new ApiCommunicationError();
        }
    }

    async addUserToExpense(userId: string, expenseId: string, requestingUserId: string): Promise<void> {
        return this._expenseManager.addUserToExpense(userId, expenseId, requestingUserId);
    }

    removeUserFromExpense(expenseId: string, userId: string): Promise<IExpenseDto> {
        return this._expenseManager.removeUserFromExpense(expenseId, userId);
    }

    addExpenseItem(
        name: string,
        price: number,
        owners: IExpenseUserDetails[],
        isProportional: boolean,
        expenseId: string,
    ): Promise<IExpenseDto> {
        return this._expenseManager.addExpenseItem(name, price, owners, isProportional, expenseId);
    }

    async removeExpenseItem(itemId: string, expenseId: string): Promise<IExpenseDto> {
        return this._expenseManager.removeExpenseItem(itemId, expenseId);
    }

    async getExpenseItems(expenseId: string): Promise<IExpenseItem[]> {
        return this._expenseManager.getExpenseItems(expenseId);
    }

    async saveUpdatedItems(updatedItems: IExpenseItem[]): Promise<IExpenseItem[]> {
        return this._expenseManager.saveUpdatedItems(updatedItems);
    }

    async getExpenseJoinRequestsForUser(userId: string): Promise<IExpenseJoinRequest[]> {
        return await this._expenseManager.getExpenseJoinRequestsForUser(userId);
    }

    getJoinRequestsForExpense(expenseId: string): Promise<IExpenseJoinRequest[]> {
        return this._expenseManager.getJoinRequestsForExpense(expenseId);
    }

    addExpenseJoinRequest(userId: string, expenseId: string, requestUserId: string): Promise<void> {
        return this._expenseManager.addExpenseJoinRequest(userId, expenseId, requestUserId);
    }

    removeExpenseJoinRequest(userId: string, expenseId: string, requestingUserId: string): Promise<void> {
        return this._expenseManager.removeExpenseJoinRequest(userId, expenseId, requestingUserId);
    }

    async replaceGuestUserInfo(guestUserId: string, registeredUser: IExpenseUserDetails): Promise<IExpenseDto[]> {
        return this._expenseManager.replaceGuestUserInfo(guestUserId, registeredUser);
    }
}
