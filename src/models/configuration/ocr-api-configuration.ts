import assert from "assert";
import { injectable } from "inversify";
import { IOcrApiConfiguration } from "./ocr-api-configuration-interface";

@injectable()
export class OcrApiConfiguration implements IOcrApiConfiguration {
    readonly uri: string;

    constructor() {
        assert(!!process.env.Uri, "OCR API URI was undefined");
        this.uri = process.env.OCR_API_URI;
    }
}
