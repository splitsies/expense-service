import { Sql } from "postgres";

export interface IPgProvider {
    provide(): Sql;
}

export const IPgProvider = Symbol.for("IPgProvider");
