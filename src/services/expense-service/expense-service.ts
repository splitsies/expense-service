import { inject, injectable } from "inversify";
import {
    IExpense,
    IExpenseMapper,
    IExpenseUpdate,
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
        @inject(IExpenseMapper) private readonly _mapper: IExpenseMapper,
        @inject(IExpenseUserDetailsMapper) private readonly _expenseUserDetailsMapper: IExpenseUserDetailsMapper,
    ) {}

    async getUserExpense(userId: string, expenseId: string): Promise<IUserExpense> {
        return this._expenseManager.getUserExpense(userId, expenseId);
    }

    async getExpense(id: string): Promise<IExpense> {
        return this._expenseManager.getExpense(id);
    }

    async createExpense(userId: string): Promise<IExpense> {
        const user = await this._usersApiClient.getById(userId);
        if (!user.data) throw new NotFoundError("User could not be found");
        return await this._expenseManager.createExpense(user.data.id);
    }

    async createExpenseFromImage(base64Image: string, userId: string): Promise<IExpense> {
        const user = await this._usersApiClient.getById(userId);
        if (!user.data) throw new NotFoundError("User could not be found");

        const ocrResult = await this._ocrApiClient.processImage(base64Image);
        this._logger.verbose({ ocrResult });

        const expenseResult = await this._algorithsmApiClient.processImage(ocrResult.data);
        if (!expenseResult.success) throw new ImageProcessingError("Could not create expense from image");

        return this._expenseManager.createExpenseFromImage(
            this._mapper.toDomainModel(expenseResult.data),
            user.data.id,
        );
    }

    async updateExpense(id: string, updated: IExpenseUpdate): Promise<IExpense> {
        return await this._expenseManager.updateExpense(id, updated);
    }

    async getExpensesForUser(userId: string): Promise<IExpense[]> {
        return await this._expenseManager.getExpensesForUser(userId);
    }

    async getUsersForExpense(expenseId: string): Promise<string[]> {
        return await this._expenseManager.getUsersForExpense(expenseId);
    }

    async getExpenseUserDetailsForExpense(expenseId: string): Promise<IExpenseUserDetails[]> {
        const ids = await this.getUsersForExpense(expenseId);

        try {
            const response = await this._usersApiClient.findUsersById(ids);
            if (!response.success) throw new Error(`${response.data}`);
            return response.data.map((u) => this._expenseUserDetailsMapper.fromUserDto(u));
        } catch (e) {
            this._logger.error(e);
            throw new ApiCommunicationError();
        }
    }

    addUserToExpense(userExpense: IUserExpense, requestingUserId: string): Promise<void> {
        return this._expenseManager.addUserToExpense(userExpense, requestingUserId);
    }

    removeUserFromExpense(expenseId: string, userId: string): Promise<void> {
        return this._expenseManager.removeUserFromExpense(expenseId, userId);
    }

    addItemToExpense(
        name: string,
        price: number,
        owners: IExpenseUserDetails[],
        isProportional: boolean,
        expenseId: string,
    ): Promise<IExpense> {
        return this._expenseManager.addItemToExpense(name, price, owners, isProportional, expenseId);
    }
}
