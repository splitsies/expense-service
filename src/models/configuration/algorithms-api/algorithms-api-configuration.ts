import assert from "assert";
import { injectable } from "inversify";
import { IAlgorithmsApiConfiguration } from "./algorithms-api-configuration-interface";

@injectable()
export class AlgorithsmApiConfiguration implements IAlgorithmsApiConfiguration {
    readonly uri: string;

    constructor() {
        assert(!!process.env.ALGORITHMS_API_URI, "ALGORITHMS_API_URI was undefined");
        this.uri = process.env.ALGORITHMS_API_URI;
    }
}
