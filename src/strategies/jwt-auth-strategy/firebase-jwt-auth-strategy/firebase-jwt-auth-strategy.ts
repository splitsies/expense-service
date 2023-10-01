import { JwtAuthStrategyBase } from "../jwt-auth-strategy-base";
import { IFirebaseJwtAuthStrategy } from "./firebase-jwt-auth-strategy-interface";
import { inject, injectable } from "inversify";
import { IAdminAuthProvider } from "src/providers/admin-auth-provider-interface";
import { ILogger } from "@splitsies/utils";
import { AuthResponse } from "aws-lambda";

@injectable()
export class FirebaseJwtAuthStrategy extends JwtAuthStrategyBase implements IFirebaseJwtAuthStrategy {
    constructor(
        @inject(ILogger) private readonly _logger: ILogger,
        @inject(IAdminAuthProvider) private readonly _authProvider: IAdminAuthProvider,
    ) {
        super();
    }

    async authenticate(token: string): Promise<AuthResponse> {
        const authorizer = this._authProvider.provide();

        try {
            const decoded = await authorizer.verifyIdToken(token);
            return this.generatePolicy(decoded.uid, "Allow");
        } catch (e) {
            this._logger.error(e);
            return this.generatePolicy(token, "Deny");
        }
    }
}
