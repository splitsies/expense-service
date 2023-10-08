import { Auth } from "firebase-admin/auth";

export interface IAdminAuthProvider {
    provide(): Auth;
}

export const IAdminAuthProvider = Symbol.for("IAdminAuthProvider");
