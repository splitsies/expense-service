import { initializeApp } from "firebase-admin/app";
import { Auth, getAuth } from "firebase-admin/auth";
import { injectable, inject } from "inversify";
import { IFirebaseConfiguration } from "src/models/configuration/firebase/firebase-configuration-interface";

import { ILogger } from "@splitsies/utils";
import { IAdminAuthProvider } from "./admin-auth-provider-interface";

@injectable()
export class AdminAuthProvider implements IAdminAuthProvider {
    private readonly auth: Auth;

    constructor(
        @inject(ILogger) logger: ILogger,
        @inject(IFirebaseConfiguration) firebaseConfig: IFirebaseConfiguration,
    ) {
        // logger.log(
        //     `Creating admin auth provider connected to ${firebaseConfig?.devMode ? "emulator" : "firebase server"}`,
        // );

        const firebaseApp = initializeApp(firebaseConfig);
        this.auth = getAuth(firebaseApp);
    }

    provide(): Auth {
        return this.auth;
    }
}
