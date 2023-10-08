import { injectable } from "inversify";
import { IJwtAuthStrategy } from "./jwt-auth-strategy-interface";
import { AuthResponse } from "aws-lambda";

@injectable()
export abstract class JwtAuthStrategyBase implements IJwtAuthStrategy {
    abstract authenticate(token: string): Promise<AuthResponse>;

    protected generatePolicy(userId: string, effect: "Allow" | "Deny"): AuthResponse {
        return {
            principalId: userId,
            policyDocument: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Action: "execute-api:Invoke",
                        Effect: effect,
                        Resource: "*",
                    },
                ],
            },
            context: {
                userId: userId,
            },
        };
    }
}
