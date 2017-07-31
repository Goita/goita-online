import { ids as oAuthConfigDev } from "./oAuthConfig.dev";
import { ids as oAuthConfigProd } from "./oAuthConfig.prod";

export const oAuthConfig = (process.env.NODE_ENV !== "production") ? oAuthConfigDev : oAuthConfigProd;
