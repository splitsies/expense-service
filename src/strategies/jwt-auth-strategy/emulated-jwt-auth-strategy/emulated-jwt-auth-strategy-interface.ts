import { IJwtAuthStrategy } from "../jwt-auth-strategy-interface";

export interface IEmulatedJwtAuthStrategy extends IJwtAuthStrategy {}
export const IEmulatedJwtAuthStrategy = Symbol.for("IEmulatedJwtAuthStrategy");
