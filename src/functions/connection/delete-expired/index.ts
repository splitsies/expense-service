import { handlerPath } from "../../../libs/handler-resolver";

export default {
    handler: `${handlerPath(__dirname)}/handler.main`,
    events: [{ schedule: "rate(${param:DELETE_EXPIRED_INTERVAL_MIN} minutes)" }],
};
