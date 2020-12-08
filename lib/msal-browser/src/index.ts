/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export { PublicClientApplication } from "./app/PublicClientApplication";
export { Configuration } from "./config/Configuration";
export { InteractionType, BrowserCacheLocation } from "./utils/BrowserConstants";
export { BrowserUtils } from "./utils/BrowserUtils";

// Browser Errors
export { BrowserAuthError, BrowserAuthErrorMessage } from "./error/BrowserAuthError";
export { BrowserConfigurationAuthError, BrowserConfigurationAuthErrorMessage } from "./error/BrowserConfigurationAuthError";

// Interfaces
export { IPublicClientApplication, stubbedPublicClientApplication } from "./app/IPublicClientApplication";
export { PopupRequest } from "./request/PopupRequest";
export { RedirectRequest } from "./request/RedirectRequest";
export { SilentRequest } from "./request/SilentRequest";
export { SsoSilentRequest } from "./request/SsoSilentRequest";
export { EndSessionRequest } from "./request/EndSessionRequest";
export { AuthorizationUrlRequest } from "./request/AuthorizationUrlRequest";

// Events
export { EventMessage, EventPayload, EventError, EventCallbackFunction } from "./event/EventMessage";
export { EventType } from "./event/EventType";

// Common Object Formats
export {
    AuthenticationScheme,
    // Account
    AccountInfo,
    // Response
    AuthenticationResult,
    // Error
    InteractionRequiredAuthError,
    AuthError,
    AuthErrorMessage,
    INetworkModule,
    // Logger Object
    ILoggerCallback,
    Logger,
    LogLevel,
    // Protocol Mode
    ProtocolMode,
    // Utils
    StringUtils,
    UrlString
} from "@azure/msal-common";
