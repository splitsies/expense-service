export interface IApiConfiguration {
    uri: {
        algorithms: string;
        ocr: string;
        users: string;
    };
}

export const IApiConfiguration = Symbol.for("IApiConfiguration");
