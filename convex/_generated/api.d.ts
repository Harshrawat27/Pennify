/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * Types reference the pennifyweb Convex deployment.
 * Do NOT run `npx convex dev` from this project.
 * @module
 */

import type {
  FilterApi,
  FunctionReference,
} from "convex/server";

export declare const api: {
  sync: {
    pushBatch: FunctionReference<
      "mutation",
      "public",
      Record<string, any>,
      any
    >;
    pullAll: FunctionReference<
      "query",
      "public",
      { userId: string },
      any
    >;
    deleteUserData: FunctionReference<
      "mutation",
      "public",
      { userId: string },
      any
    >;
  };
};

export declare const internal: any;
export declare const components: any;
