import "reflect-metadata";
import { ILogger } from "@splitsies/utils";
import { container } from "src/di/inversify.config";
import { IJwtStrategyProvider } from "src/providers/jwt-strategy-provider/jwt-strategy-provider-interface";
import { APIGatewayTokenAuthorizerEvent, AuthResponse } from "aws-lambda";

const logger = container.get<ILogger>(ILogger);
const jwtStrategyProvider = container.get<IJwtStrategyProvider>(IJwtStrategyProvider);

export const main = async (event: APIGatewayTokenAuthorizerEvent): Promise<AuthResponse> => {
    try {
        const authToken =
            event.authorizationToken ??
            (Object.values((event as any).headers).find((header: string) => header.includes?.("Bearer")) as string);
        const jwt = authToken.split(" ")[1];

        const strategy = jwtStrategyProvider.provide();
        const policy = await strategy.authenticate(jwt);
        logger.log(policy);
        return policy;
    } catch (e) {
        logger.error(e);
    }
};
