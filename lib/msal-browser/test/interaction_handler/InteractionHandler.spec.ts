/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { expect } from "chai";
import "mocha";
import { InteractionHandler } from "../../src/interaction_handler/InteractionHandler";
import {
    PkceCodes,
    NetworkRequestOptions,
    LogLevel,
    AccountInfo,
    AuthorityFactory,
    AuthorizationCodeRequest,
    AuthenticationResult,
    AuthorizationCodeClient,
    AuthenticationScheme,
    ProtocolMode,
    Logger,
    Authority,
    ClientConfiguration,
    AuthorizationCodePayload,
} from "@azure/msal-common";
import { Configuration, buildConfiguration } from "../../src/config/Configuration";
import { TEST_CONFIG, TEST_URIS, TEST_DATA_CLIENT_INFO, TEST_TOKENS, TEST_TOKEN_LIFETIMES, TEST_HASHES, TEST_POP_VALUES, TEST_STATE_VALUES } from "../utils/StringConstants";
import { BrowserAuthErrorMessage, BrowserAuthError } from "../../src/error/BrowserAuthError";
import sinon from "sinon";
import { CryptoOps } from "../../src/crypto/CryptoOps";
import { TestStorageManager } from "../cache/TestStorageManager";
import { BrowserCacheManager } from "../../src/cache/BrowserCacheManager";

class TestInteractionHandler extends InteractionHandler {

    constructor(authCodeModule: AuthorizationCodeClient, storageImpl: BrowserCacheManager) {
        super(authCodeModule, storageImpl);
    }

    showUI(requestUrl: string): Window {
        throw new Error("Method not implemented.");
    }

    initiateAuthRequest(requestUrl: string): Window | Promise<HTMLIFrameElement> {
        this.authCodeRequest = testAuthCodeRequest;
        return null;
    }
}

const testAuthCodeRequest: AuthorizationCodeRequest = {
    authenticationScheme: AuthenticationScheme.BEARER,
    authority: "",
    redirectUri: TEST_URIS.TEST_REDIR_URI,
    scopes: ["scope1", "scope2"],
    code: "",
    correlationId: ""
};

const testPkceCodes = {
    challenge: "TestChallenge",
    verifier: "TestVerifier"
} as PkceCodes;

const testNetworkResult = {
    testParam: "testValue"
};

const testKeySet = ["testKey1", "testKey2"];

const networkInterface = {
    sendGetRequestAsync<T>(
        url: string,
        options?: NetworkRequestOptions
    ): T {
        return null;
    },
    sendPostRequestAsync<T>(
        url: string,
        options?: NetworkRequestOptions
    ): T {
        return null;
    },
};

let authorityInstance: Authority;
let authConfig: ClientConfiguration;

describe("InteractionHandler.ts Unit Tests", () => {

    let authCodeModule: AuthorizationCodeClient;
    let browserStorage: BrowserCacheManager;
    const cryptoOpts = new CryptoOps();

    beforeEach(() => {
        const appConfig: Configuration = {
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        };
        const configObj = buildConfiguration(appConfig);
        authorityInstance = AuthorityFactory.createInstance(configObj.auth.authority, networkInterface, ProtocolMode.AAD);
        authConfig = {
            authOptions: {
                ...configObj.auth,
                authority: authorityInstance,
            },
            systemOptions: {
                tokenRenewalOffsetSeconds: configObj.system.tokenRenewalOffsetSeconds
            },
            cryptoInterface: {
                createNewGuid: (): string => {
                    return "newGuid";
                },
                base64Decode: (input: string): string => {
                    return "testDecodedString";
                },
                base64Encode: (input: string): string => {
                    return "testEncodedString";
                },
                generatePkceCodes: async (): Promise<PkceCodes> => {
                    return testPkceCodes;
                },
                getPublicKeyThumbprint: async (): Promise<string> => {
                    return TEST_POP_VALUES.ENCODED_REQ_CNF;
                },
                signJwt: async (): Promise<string> => {
                    return "signedJwt";
                }
            },
            storageInterface: new TestStorageManager(),
            networkInterface: {
                sendGetRequestAsync: async (url: string, options?: NetworkRequestOptions): Promise<any> => {
                    return testNetworkResult;
                },
                sendPostRequestAsync: async (url: string, options?: NetworkRequestOptions): Promise<any> => {
                    return testNetworkResult;
                }
            },
            loggerOptions: {
                loggerCallback: (level: LogLevel, message: string, containsPii: boolean): void => {},
                piiLoggingEnabled: true
            }
        };
        authCodeModule = new AuthorizationCodeClient(authConfig);
        const logger = new Logger(authConfig.loggerOptions);
        browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, configObj.cache, cryptoOpts, logger);
    });

    afterEach(() => {
        sinon.restore();
    });

    it("Constructor", () => {
        const interactionHandler = new TestInteractionHandler(authCodeModule, browserStorage);

        expect(interactionHandler instanceof TestInteractionHandler).to.be.true;
        expect(interactionHandler instanceof InteractionHandler).to.be.true;
    });

    describe("handleCodeResponse()", () => {

        it("throws error if given location hash is empty", async () => {
            const interactionHandler = new TestInteractionHandler(authCodeModule, browserStorage);
            await expect(interactionHandler.handleCodeResponse("", authorityInstance, authConfig.networkInterface)).to.be.rejectedWith(BrowserAuthErrorMessage.hashEmptyError.desc);
            await expect(interactionHandler.handleCodeResponse("", authorityInstance, authConfig.networkInterface)).to.be.rejectedWith(BrowserAuthError);

            await expect(interactionHandler.handleCodeResponse(null, authorityInstance, authConfig.networkInterface)).to.be.rejectedWith(BrowserAuthErrorMessage.hashEmptyError.desc);
            await expect(interactionHandler.handleCodeResponse(null, authorityInstance, authConfig.networkInterface)).to.be.rejectedWith(BrowserAuthError);
        });
        
        // TODO: Need to improve this test
        it("successfully uses a new authority if cloud_instance_host_name is different", async () => {
            const idTokenClaims = {
                "ver": "2.0",
                "iss": `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                "exp": "1536361411",
                "name": "Abe Lincoln",
                "preferred_username": "AbeLi@microsoft.com",
                "oid": "00000000-0000-0000-66f3-3332eca7ea81",
                "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
                "nonce": "123523"
            };

            const testCodeResponse: AuthorizationCodePayload = {
                code: "authcode",
                nonce: idTokenClaims.nonce,
                state: TEST_STATE_VALUES.TEST_STATE,
                cloud_instance_host_name: "contoso.com"
            };

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                environment: "login.windows.net",
                tenantId: idTokenClaims.tid,
                username: idTokenClaims.preferred_username,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_LOCAL_ACCOUNT_ID
            };
            const testTokenResponse: AuthenticationResult = {
                authority: authorityInstance.canonicalAuthority,
                accessToken: TEST_TOKENS.ACCESS_TOKEN,
                idToken: TEST_TOKENS.IDTOKEN_V2,
                fromCache: false,
                scopes: ["scope1", "scope2"],
                account: testAccount,
                expiresOn: new Date(Date.now() + (TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN * 1000)),
                idTokenClaims: idTokenClaims,
                tenantId: idTokenClaims.tid,
                uniqueId: idTokenClaims.oid,
                state: "testState",
                tokenType: AuthenticationScheme.BEARER
            };
            browserStorage.setTemporaryCache(browserStorage.generateStateKey(TEST_STATE_VALUES.TEST_STATE), TEST_STATE_VALUES.TEST_STATE);
            browserStorage.setTemporaryCache(browserStorage.generateNonceKey(TEST_STATE_VALUES.TEST_STATE), idTokenClaims.nonce);
            sinon.stub(AuthorizationCodeClient.prototype, "handleFragmentResponse").returns(testCodeResponse);
            sinon.stub(Authority.prototype, "isAuthorityAlias").returns(false);
            const authority = new Authority("https://www.contoso.com/common/", networkInterface, ProtocolMode.AAD);
            sinon.stub(AuthorityFactory, "createDiscoveredInstance").resolves(authority);
            sinon.stub(Authority.prototype, "discoveryComplete").returns(true);
            const updateAuthoritySpy = sinon.spy(AuthorizationCodeClient.prototype, "updateAuthority");
            const acquireTokenSpy = sinon.stub(AuthorizationCodeClient.prototype, "acquireToken").resolves(testTokenResponse);
            const interactionHandler = new TestInteractionHandler(authCodeModule, browserStorage);
            await interactionHandler.initiateAuthRequest("testNavUrl");
            const tokenResponse = await interactionHandler.handleCodeResponse(TEST_HASHES.TEST_SUCCESS_CODE_HASH, authorityInstance, authConfig.networkInterface);
            expect(updateAuthoritySpy.calledWith(authority)).to.be.true;
            expect(tokenResponse).to.deep.eq(testTokenResponse);
            expect(acquireTokenSpy.calledWith(testAuthCodeRequest, testCodeResponse)).to.be.true;
            expect(acquireTokenSpy.threw()).to.be.false;
        });
    });
});
