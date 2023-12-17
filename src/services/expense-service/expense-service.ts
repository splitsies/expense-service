import { inject, injectable } from "inversify";
import {
    ExpenseJoinRequestDto,
    ExpensePayload,
    IExpense,
    IExpenseJoinRequest,
    IExpenseJoinRequestDto,
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
import { InvalidStateError } from "src/models/error/invalid-state-error";
import { UnauthorizedUserError } from "src/models/error/unauthorized-user-error";

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
        @inject(IExpenseMapper) private readonly _expenseMapper: IExpenseMapper,
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

    async addUserToExpense(userExpense: IUserExpense, requestingUserId: string): Promise<void> {
        const response = await this._usersApiClient.getById(userExpense.userId);

        if (!response.success) {
            throw new ApiCommunicationError(`Could not fetch user for ${userExpense.userId}`);
        }

        if (!response.data) {
            throw new InvalidStateError("User for the corresponding request was not found");
        }

        const user = this._expenseUserDetailsMapper.fromUserDto(response.data);
        if (user.isRegistered && userExpense.userId !== requestingUserId) {
            // if the user is registered, then only that user can decide to be added to an expense
            // i.e. this request is accepting a join request and must be initiated by that user themselves
            const message = `User ${requestingUserId} is not authorized to add user ${userExpense.userId} to expense ${userExpense.expenseId}`;
            this._logger.warn(message);
            throw new UnauthorizedUserError(message);
        }

        if (!user.isRegistered) {
            // Then ensure that this user is authorized to add a guest to this expense
            const exists = !!this._expenseManager.getUserExpense(requestingUserId, userExpense.expenseId);
            if (!exists) {
                const message = `User ${requestingUserId} is not authorized to add user ${userExpense.userId} to expense ${userExpense.expenseId}`;
                this._logger.warn(message);
                throw new UnauthorizedUserError(message);
            }
        } else {
            // If the user is registered, an expense join request must exist
            if (!(await this._expenseManager.joinRequestExists(userExpense.userId, userExpense.expenseId))) {
                throw new UnauthorizedUserError("Join request does not exist");
            }
        }

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

    async getExpenseJoinRequestsForUser(userId: string): Promise<IExpenseJoinRequestDto[]> {
        const joinRequests = await this._expenseManager.getExpenseJoinRequestsForUser(userId);
        if (joinRequests.length === 0) return [];

        const response = await this._usersApiClient.findUsersById(joinRequests.map((r) => r.requestingUserId));
        if (!response.success)
            throw new ApiCommunicationError(`Error requesting users: status=${response.statusCode} - ${response.data}`);
        const requestingUsers = response.data;

        const mappedJoinRequests: IExpenseJoinRequestDto[] = [];

        for (const request of joinRequests) {
            const requestingUser = requestingUsers.find((r) => r.id === request.requestingUserId);

            if (!requestingUser) {
                this._logger.warn(
                    `ExpenseJoinRequest for userId=${request.userId}, expenseId=${request.expenseId} from user ${request.requestingUserId} that does not exist`,
                );
                await this._expenseManager.removeExpenseJoinRequest(request.userId, request.expenseId);
                continue;
            }

            const expense = await this.getExpense(request.expenseId);
            if (!expense) {
                this._logger.warn(
                    `ExpenseJoinRequest for userId=${request.userId}, expenseId=${request.expenseId} - Expense does not exist`,
                );
                await this._expenseManager.removeExpenseJoinRequest(request.userId, request.expenseId);
                continue;
            }

            const expenseUsers = await this.getExpenseUserDetailsForExpense(request.expenseId);
            mappedJoinRequests.push(
                new ExpenseJoinRequestDto(
                    request.userId,
                    new ExpensePayload(this._expenseMapper.toDtoModel(expense), expenseUsers),
                    requestingUser,
                    request.createdAt.toISOString(),
                ),
            );
        }

        return mappedJoinRequests;
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
}
