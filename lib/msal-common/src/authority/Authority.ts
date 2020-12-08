/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthorityType } from "./AuthorityType";
import { OpenIdConfigResponse } from "./OpenIdConfigResponse";
import { UrlString } from "../url/UrlString";
import { IUri } from "../url/IUri";
import { ClientAuthError } from "../error/ClientAuthError";
import { INetworkModule } from "../network/INetworkModule";
import { NetworkResponse } from "../network/NetworkManager";
import { Constants } from "../utils/Constants";
import { TrustedAuthority } from "./TrustedAuthority";
import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { ProtocolMode } from "./ProtocolMode";

/**
 * The authority class validates the authority URIs used by the user, and retrieves the OpenID Configuration Data from the
 * endpoint. It will store the pertinent config data in this object for use during token calls.
 */
export class Authority {

    // Canonical authority url string
    private _canonicalAuthority: UrlString;
    // Canonicaly authority url components
    private _canonicalAuthorityUrlComponents: IUri | null;
    // Tenant discovery response retrieved from OpenID Configuration Endpoint
    private tenantDiscoveryResponse: OpenIdConfigResponse;
    // Network interface to make requests with.
    protected networkInterface: INetworkModule;
    // Protocol mode to construct endpoints
    private authorityProtocolMode: ProtocolMode;

    constructor(authority: string, networkInterface: INetworkModule, protocolMode: ProtocolMode) {
        this.canonicalAuthority = authority;
        this._canonicalAuthority.validateAsUri();
        this.networkInterface = networkInterface;
        this.authorityProtocolMode = protocolMode;
    }

    // See above for AuthorityType
    public get authorityType(): AuthorityType {
        const pathSegments = this.canonicalAuthorityUrlComponents.PathSegments;

        if (pathSegments.length && pathSegments[0].toLowerCase() === Constants.ADFS) {
            return AuthorityType.Adfs;
        }

        return AuthorityType.Default;
    }

    /**
     * ProtocolMode enum representing the way endpoints are constructed.
     */
    public get protocolMode(): ProtocolMode {
        return this.authorityProtocolMode;
    }

    /**
     * A URL that is the authority set by the developer
     */
    public get canonicalAuthority(): string {
        return this._canonicalAuthority.urlString;
    }

    /**
     * Sets canonical authority.
     */
    public set canonicalAuthority(url: string) {
        this._canonicalAuthority = new UrlString(url);
        this._canonicalAuthority.validateAsUri();
        this._canonicalAuthorityUrlComponents = null;
    }

    /**
     * Get authority components.
     */
    public get canonicalAuthorityUrlComponents(): IUri {
        if (!this._canonicalAuthorityUrlComponents) {
            this._canonicalAuthorityUrlComponents = this._canonicalAuthority.getUrlComponents();
        }

        return this._canonicalAuthorityUrlComponents;
    }

    /**
     * Get tenant for authority.
     */
    public get tenant(): string {
        return this.canonicalAuthorityUrlComponents.PathSegments[0];
    }

    /**
     * OAuth /authorize endpoint for requests
     */
    public get authorizationEndpoint(): string {
        if(this.discoveryComplete()) {
            return this.replaceTenant(this.tenantDiscoveryResponse.authorization_endpoint);
        } else {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError("Discovery incomplete.");
        }
    }

    /**
     * OAuth /token endpoint for requests
     */
    public get tokenEndpoint(): string {
        if(this.discoveryComplete()) {
            return this.replaceTenant(this.tenantDiscoveryResponse.token_endpoint);
        } else {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError("Discovery incomplete.");
        }
    }

    public get deviceCodeEndpoint(): string {
        if(this.discoveryComplete()) {
            return this.tenantDiscoveryResponse.token_endpoint.replace("/token", "/devicecode");
        } else {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError("Discovery incomplete.");
        }
    }

    /**
     * OAuth logout endpoint for requests
     */
    public get endSessionEndpoint(): string {
        if(this.discoveryComplete()) {
            return this.replaceTenant(this.tenantDiscoveryResponse.end_session_endpoint);
        } else {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError("Discovery incomplete.");
        }
    }

    /**
     * OAuth issuer for requests
     */
    public get selfSignedJwtAudience(): string {
        if(this.discoveryComplete()) {
            return this.replaceTenant(this.tenantDiscoveryResponse.issuer);
        } else {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError("Discovery incomplete.");
        }
    }

    /**
     * Replaces tenant in url path with current tenant. Defaults to common.
     * @param urlString
     */
    private replaceTenant(urlString: string): string {
        return urlString.replace(/{tenant}|{tenantid}/g, this.tenant);
    }

    /**
     * The default open id configuration endpoint for any canonical authority.
     */
    protected get defaultOpenIdConfigurationEndpoint(): string {
        if (this.authorityType === AuthorityType.Adfs || this.protocolMode === ProtocolMode.OIDC) {
            return `${this.canonicalAuthority}.well-known/openid-configuration`;
        }
        return `${this.canonicalAuthority}v2.0/.well-known/openid-configuration`;
    }

    /**
     * Boolean that returns whethr or not tenant discovery has been completed.
     */
    discoveryComplete(): boolean {
        return !!this.tenantDiscoveryResponse;
    }

    /**
     * Gets OAuth endpoints from the given OpenID configuration endpoint.
     * @param openIdConfigurationEndpoint
     */
    private async discoverEndpoints(openIdConfigurationEndpoint: string): Promise<NetworkResponse<OpenIdConfigResponse>> {
        return this.networkInterface.sendGetRequestAsync<OpenIdConfigResponse>(openIdConfigurationEndpoint);
    }

    /**
     * Set the trusted hosts and validate subsequent calls
     */
    private async validateAndSetPreferredNetwork(): Promise<void> {
        const host = this.canonicalAuthorityUrlComponents.HostNameAndPort;
        if (TrustedAuthority.getTrustedHostList().length === 0) {
            await TrustedAuthority.setTrustedAuthoritiesFromNetwork(this._canonicalAuthority, this.networkInterface);
        }

        if (!TrustedAuthority.IsInTrustedHostList(host)) {
            throw ClientConfigurationError.createUntrustedAuthorityError();
        }

        const preferredNetwork = TrustedAuthority.getCloudDiscoveryMetadata(host).preferred_network;
        if (host !== preferredNetwork) {
            this.canonicalAuthority = this.canonicalAuthority.replace(host, preferredNetwork);
        }
    }

    /**
     * Perform endpoint discovery to discover the /authorize, /token and logout endpoints.
     */
    public async resolveEndpointsAsync(): Promise<void> {
        await this.validateAndSetPreferredNetwork();
        const openIdConfigEndpoint = this.defaultOpenIdConfigurationEndpoint;
        const response = await this.discoverEndpoints(openIdConfigEndpoint);
        this.tenantDiscoveryResponse = response.body;
    }

    /**
     * Determine if given hostname is alias of this authority
     * @param host 
     */
    public isAuthorityAlias(host: string): boolean {
        if (host === this.canonicalAuthorityUrlComponents.HostNameAndPort) {
            return true;
        }
        const aliases = TrustedAuthority.getCloudDiscoveryMetadata(this.canonicalAuthorityUrlComponents.HostNameAndPort).aliases;
        return aliases.indexOf(host) !== -1;
    }

    /**
     * helper function to generate environment from authority object
     * @param authority
     */
    static generateEnvironmentFromAuthority(authority: Authority): string {
        const reqEnvironment = authority.canonicalAuthorityUrlComponents.HostNameAndPort;
        return TrustedAuthority.getCloudDiscoveryMetadata(reqEnvironment) ? TrustedAuthority.getCloudDiscoveryMetadata(reqEnvironment).preferred_cache : "";
    }
}
