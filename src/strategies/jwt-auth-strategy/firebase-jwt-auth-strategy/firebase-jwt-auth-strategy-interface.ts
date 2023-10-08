import { IJwtAuthStrategy } from "../jwt-auth-strategy-interface";

export interface IFirebaseJwtAuthStrategy extends IJwtAuthStrategy {}
export const IFirebaseJwtAuthStrategy = Symbol.for("IFirebaseJwtAuthStrategy");
