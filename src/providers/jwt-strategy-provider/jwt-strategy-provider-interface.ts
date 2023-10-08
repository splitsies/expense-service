import { IJwtAuthStrategy } from "src/strategies/jwt-auth-strategy/jwt-auth-strategy-interface";

export interface IJwtStrategyProvider {
    provide(): IJwtAuthStrategy;
}
export const IJwtStrategyProvider = Symbol.for("IJwtStrategyProvider");
