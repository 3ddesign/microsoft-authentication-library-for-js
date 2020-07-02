import { BaseAuthRequest } from "./BaseAuthRequest";
/**
 * RefreshTokenRequest
 * - scopes                  - A space-separated array of scopes for the same resource.
 * - authority               - URL of the authority, the security token service (STS) from which MSAL will acquire tokens.
 * - correlationId           - Unique GUID set per request to trace a request end-to-end for telemetry purposes.
 * - refreshToken            - A refresh token returned from a previous request to the Identity provider.
 * - redirectUri             - The redirect URI where authentication responses can be received by your application. It must exactly match one of the redirect URIs registered in the Azure portal.
 */
export declare type RefreshTokenRequest = BaseAuthRequest & {
    refreshToken: string;
};
