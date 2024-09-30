export interface ICrossStageTopicProvider {
    provide(gatewayUrl: string): string;
}
export const ICrossStageTopicProvider = Symbol.for("ICrossStageTopicProvider");