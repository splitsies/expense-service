import { IExpenseUserDetails } from "@splitsies/shared-models";

export interface IUserDataStrategy {
    deleteUserData(userId: string): Promise<string[]>;
    replaceGuestUserInfo(guestUserId: string, registeredUser: IExpenseUserDetails): Promise<string[]>;
}
export const IUserDataStrategy = Symbol.for("IUserDataStrategy");