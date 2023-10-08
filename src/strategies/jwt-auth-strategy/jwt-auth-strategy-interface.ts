import { AuthResponse } from "aws-lambda";

export interface IJwtAuthStrategy {
    authenticate(token: string): Promise<AuthResponse>; // what is policy type???
}

export const IJwtAuthStrategy = Symbol.for("IJwtAuthStrategy");
