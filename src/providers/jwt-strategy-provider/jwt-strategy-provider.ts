import { IJwtAuthStrategy } from "src/strategies/jwt-auth-strategy/jwt-auth-strategy-interface";
import { IJwtStrategyProvider } from "./jwt-strategy-provider-interface";
import { inject, injectable } from "inversify";
import { IEmulatedJwtAuthStrategy } from "src/strategies/jwt-auth-strategy/emulated-jwt-auth-strategy/emulated-jwt-auth-strategy-interface";
import { IFirebaseJwtAuthStrategy } from "src/strategies/jwt-auth-strategy/firebase-jwt-auth-strategy/firebase-jwt-auth-strategy-interface";

@injectable()
export class JwtStrategyProvider implements IJwtStrategyProvider {
    constructor(
        @inject(IEmulatedJwtAuthStrategy) private readonly _emulated: IEmulatedJwtAuthStrategy,
        @inject(IFirebaseJwtAuthStrategy) private readonly _firebase: IFirebaseJwtAuthStrategy,
    ) {}

    provide(): IJwtAuthStrategy {
        return process.env.IS_OFFLINE === "true" ? this._emulated : this._firebase;
    }
}
