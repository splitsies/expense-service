import assert from "assert";
import { injectable } from "inversify";
import { IApiConfiguration } from "./api-configuration-interface";

@injectable()
export class ApiConfiguration implements IApiConfiguration {
    readonly uri: { algorithms: string; ocr: string; users: string };

    constructor() {
        assert(!!process.env.USERS_API_URI, "USERS_API_URI was undefined");
        assert(!!process.env.ALGORITHMS_API_URI, "ALGORITHMS_API_URI was undefined");
        assert(!!process.env.OCR_API_URI, "OCR API URI was undefined");

        this.uri = {
            users: process.env.USERS_API_URI,
            algorithms: process.env.ALGORITHMS_API_URI,
            ocr: process.env.OCR_API_URI,
        };
    }
}
