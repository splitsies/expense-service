import { inject, injectable } from "inversify";
import { IEmulatedJwtAuthStrategy } from "./emulated-jwt-auth-strategy-interface";
import { JwtAuthStrategyBase } from "../jwt-auth-strategy-base";
import jwt_decode from "jwt-decode";
import { ILogger } from "@splitsies/utils";
import { AuthResponse } from "aws-lambda";

@injectable()
export class EmulatedJwtAuthStrategy extends JwtAuthStrategyBase implements IEmulatedJwtAuthStrategy {
    constructor(@inject(ILogger) private readonly logger: ILogger) {
        super();
    }

    authenticate(token: string): Promise<AuthResponse> {
        if (process.env.IS_OFFLINE !== "true") {
            throw new Error("Attempted emulated authorization in a non-emulated environment");
        }

        const decoded = jwt_decode(token);
        this.logger.log(decoded);
        return Promise.resolve(this.generatePolicy(decoded["user_id"], "Allow"));
    }
}
