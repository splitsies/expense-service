export interface ICrossGatewayTopicProvider {
    provide(gatewayUrl: string): string;
}
export const ICrossGatewayTopicProvider = Symbol.for("ICrossGatewayTopicProvider");
