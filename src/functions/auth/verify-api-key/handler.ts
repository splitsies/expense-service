import "reflect-metadata";
import { InternalApiKeyValidatorFactory } from "@splitsies/utils";
import { container } from "src/di/inversify.config";

export const main = InternalApiKeyValidatorFactory.create(container);
