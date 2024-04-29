import "reflect-metadata";
import { AuthTokenValidatorFactory } from "@splitsies/utils";
import { container } from "src/di/inversify.config";

export const main = AuthTokenValidatorFactory.create(container);
