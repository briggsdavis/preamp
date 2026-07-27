/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as cms from "../cms.js";
import type * as crons from "../crons.js";
import type * as dietaryTags from "../dietaryTags.js";
import type * as events from "../events.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as inquiries from "../inquiries.js";
import type * as marketing from "../marketing.js";
import type * as menu from "../menu.js";
import type * as menuQuiz from "../menuQuiz.js";
import type * as merch from "../merch.js";
import type * as reviews from "../reviews.js";
import type * as seedData from "../seedData.js";
import type * as settings from "../settings.js";
import type * as submissionEmails from "../submissionEmails.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  analytics: typeof analytics;
  auth: typeof auth;
  cms: typeof cms;
  crons: typeof crons;
  dietaryTags: typeof dietaryTags;
  events: typeof events;
  files: typeof files;
  http: typeof http;
  inquiries: typeof inquiries;
  marketing: typeof marketing;
  menu: typeof menu;
  menuQuiz: typeof menuQuiz;
  merch: typeof merch;
  reviews: typeof reviews;
  seedData: typeof seedData;
  settings: typeof settings;
  submissionEmails: typeof submissionEmails;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  resend: import("@convex-dev/resend/_generated/component.js").ComponentApi<"resend">;
};
