import assert from "assert";
import { injectable } from "inversify";
import { IOcrApiConfiguration } from "./ocr-api-configuration-interface";

@injectable()
export class OcrApiConfiguration implements IOcrApiConfiguration {
    private readonly _uri: string;

    constructor() {
        assert(!!process.env.Uri, "OCR API URI was undefined");
        this._uri = process.env.Uri;
    }

    get uri(): string {
        return this._uri;
    }
}
