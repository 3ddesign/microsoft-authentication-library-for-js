/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult, AuthorizationCodeRequest, AuthorizationUrlRequest, ClientCredentialRequest, Logger, OnBehalfOfRequest, RefreshTokenRequest, SilentFlowRequest } from "@azure/msal-common";
import { NodeConfigurationAuthError } from "../error/NodeConfigurationAuthError";
import { TokenCache } from "../cache/TokenCache";
export interface IConfidentialClientApplication {
    getAuthCodeUrl(request: AuthorizationUrlRequest): Promise<string>;
    acquireTokenByCode(request: AuthorizationCodeRequest): Promise<AuthenticationResult>;
    acquireTokenSilent(request: SilentFlowRequest): Promise<AuthenticationResult>;
    acquireTokenByRefreshToken(request: RefreshTokenRequest): Promise<AuthenticationResult>;
    acquireTokenByClientCredential(request: ClientCredentialRequest): Promise<AuthenticationResult>;
    acquireTokenOnBehalfOf(request: OnBehalfOfRequest): Promise<AuthenticationResult>;
    getTokenCache(): TokenCache;
    getLogger(): Logger;
    setLogger(logger: Logger): void;
}

export const stubbedConfidentialClientApplication: IConfidentialClientApplication = {
    getAuthCodeUrl: () => {
        return Promise.reject(NodeConfigurationAuthError.createStubPcaInstanceCalledError);
    },
    acquireTokenByCode: () => {
        return Promise.reject(NodeConfigurationAuthError.createStubPcaInstanceCalledError);
    },
    acquireTokenSilent: () => {
        return Promise.reject(NodeConfigurationAuthError.createStubPcaInstanceCalledError);
    },
    acquireTokenByRefreshToken: () => {
        return Promise.reject(NodeConfigurationAuthError.createStubPcaInstanceCalledError);
    },
    acquireTokenByClientCredential: () => {
        return Promise.reject(NodeConfigurationAuthError.createStubPcaInstanceCalledError);
    },
    acquireTokenOnBehalfOf: () => {
        return Promise.reject(NodeConfigurationAuthError.createStubPcaInstanceCalledError);
    },
    getTokenCache: () => {
        throw NodeConfigurationAuthError.createStubTokenCacheCalledError();
    },
    getLogger: () => {
        throw NodeConfigurationAuthError.createStubPcaInstanceCalledError();
    },
    setLogger: () => {
        throw NodeConfigurationAuthError.createStubPcaInstanceCalledError();
    }
};

