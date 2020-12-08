/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Constants } from "@azure/msal-common";
import { PopupRequest } from "../request/PopupRequest";
import { RedirectRequest } from "../request/RedirectRequest";

/**
 * Constants
 */
export const BrowserConstants = {
    // Interaction in progress cache value
    INTERACTION_IN_PROGRESS_VALUE: "interaction_in_progress",
    // Invalid grant error code
    INVALID_GRANT_ERROR: "invalid_grant",
    // Default popup window width
    POPUP_WIDTH: 483,
    // Default popup window height
    POPUP_HEIGHT: 600,
    // Default popup monitor poll interval in milliseconds
    POLL_INTERVAL_MS: 50,
    // msal-browser SKU
    MSAL_SKU: "msal.js.browser",
};

export enum BrowserCacheLocation {
    LocalStorage = "localStorage",
    SessionStorage = "sessionStorage",
    MemoryStorage = "memoryStorage"
}

/**
 * HTTP Request types supported by MSAL.
 */
export enum HTTP_REQUEST_TYPE {
    GET = "GET",
    POST = "POST"
}

/**
 * Temporary cache keys for MSAL, deleted after any request.
 */
export enum TemporaryCacheKeys {
    AUTHORITY = "authority",
    ACQUIRE_TOKEN_ACCOUNT = "acquireToken.account",
    SESSION_STATE = "session.state",
    REQUEST_STATE = "request.state",
    NONCE_IDTOKEN = "nonce.id_token",
    ORIGIN_URI = "request.origin",
    RENEW_STATUS = "token.renew.status",
    URL_HASH = "urlHash",
    REQUEST_PARAMS = "request.params",
    SCOPES = "scopes",
    INTERACTION_STATUS_KEY = "interaction.status"
}

/**
 * API Codes for Telemetry purposes. 
 * Before adding a new code you must claim it in the MSAL Telemetry tracker as these number spaces are shared across all MSALs
 * 0-99 Silent Flow
 * 800-899 Auth Code Flow
 */
export enum ApiId {
    acquireTokenRedirect = 861,
    acquireTokenPopup = 862,
    ssoSilent = 863,
    acquireTokenSilent_authCode = 864,
    handleRedirectPromise = 865,
    acquireTokenSilent_silentFlow = 61
}

/*
 * Interaction type of the API - used for state and telemetry
 */
export enum InteractionType {
    Redirect = "redirect",
    Popup = "popup",
    Silent = "silent"
}

export const DEFAULT_REQUEST: RedirectRequest|PopupRequest = {
    scopes: [Constants.OPENID_SCOPE, Constants.PROFILE_SCOPE]
};

// JWK Key Format string (Type MUST be defined for window crypto APIs)
export const KEY_FORMAT_JWK = "jwk";
