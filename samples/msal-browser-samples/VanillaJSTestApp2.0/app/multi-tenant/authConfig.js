const homeTenant = "72f988bf-86f1-41af-91ab-2d7cd011db47";
const guestTenant = "5d97b14d-c396-4aee-b524-c86d33e9b660"

// Config object to be passed to Msal on creation
const msalConfig = {
    auth: {
        clientId: "bc77b0a7-16aa-4af4-884b-41b968c9c71a",
        authority: `https://login.microsoftonline.com/${homeTenant}`
    },
    cache: {
        cacheLocation: "sessionStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    },
    system: {
        loggerOptions: {
            logLevel: msal.LogLevel.Trace,
            loggerCallback: (level, message, containsPii) => {
                if (containsPii) {
                    return;
                }
                switch (level) {
                    case msal.LogLevel.Error:
                        console.error(message);
                        return;
                    case msal.LogLevel.Info:
                        console.info(message);
                        return;
                    case msal.LogLevel.Verbose:
                        console.debug(message);
                        return;
                    case msal.LogLevel.Warning:
                        console.warn(message);
                        return;
                    default:
                        console.log(message);
                        return;
                }
            }
        }
    },
    telemetry: {
        application: {
            appName: "MSAL Browser V2 Multi-tenant Sample",
            appVersion: "1.0.0"
        }
    }
};

// Add here scopes for id token to be used at MS Identity Platform endpoints.
const loginRequest = {
    scopes: ["User.Read"]
};

// Add here the endpoints for MS Graph API services you would like to use.
const graphConfig = {
    graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
};

const silentRequest = {
    scopes: ["openid", "profile", "User.Read"]
};

const guestTenantRequest = {
    ...loginRequest,
    authority: `https://login.microsoftonline.com/${guestTenant}`
}