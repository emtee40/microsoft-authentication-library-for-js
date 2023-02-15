import * as puppeteer from "puppeteer";
import * as path from "path";
import { Screenshot, setupCredentials, enterCredentials, retrieveAppConfiguration } from "../../../e2eTestUtils/TestUtils";
import { LabClient } from "../../../e2eTestUtils/LabClient";
import { LabApiQueryParams } from "../../../e2eTestUtils/LabApiQueryParams";
import { AzureEnvironments, AppTypes, UserTypes, AppPlatforms } from "../../../e2eTestUtils/Constants";
import { BrowserCacheUtils } from "../../../e2eTestUtils/BrowserCacheTestUtils";
import { StringReplacer } from "../../../e2eTestUtils/ConfigUtils";

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots/profile-tests`;

const stringReplacer = new StringReplacer(path.join(__dirname, "../src/app/app.module.ts"));

async function verifyTokenStore(BrowserCache: BrowserCacheUtils, scopes: string[]): Promise<void> {
    const tokenStore = await BrowserCache.getTokens();
    expect(tokenStore.idTokens.length).toBe(1);
    expect(tokenStore.accessTokens.length).toBe(1);
    expect(tokenStore.refreshTokens.length).toBe(1);
    expect(await BrowserCache.getAccountFromCache(tokenStore.idTokens[0])).not.toBeNull();
    expect(await BrowserCache.accessTokenForScopesExists(tokenStore.accessTokens, scopes)).toBeTruthy;
    const storage = await BrowserCache.getWindowStorage();
    expect(Object.keys(storage).length).toBe(7);
}

describe('/ (Profile Page)', () => {
    jest.retryTimes(1);
    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let port: number;
    let clientID: string;
    let authority: string;
    let username: string;
    let accountPwd: string;
    let BrowserCache: BrowserCacheUtils;

    beforeAll(async () => {
        // @ts-ignore
        browser = await global.__BROWSER__;
        // @ts-ignore
        port = global.__PORT__;

        const labApiParams: LabApiQueryParams = {
            azureEnvironment: AzureEnvironments.CLOUD,
            appType: AppTypes.CLOUD,
            userType: UserTypes.CLOUD,
            appPlatform: AppPlatforms.SPA,
        };

        const labClient = new LabClient();
        const envResponse = await labClient.getVarsByCloudEnvironment(labApiParams);

        [username, accountPwd] = await setupCredentials(envResponse[0], labClient);
        [clientID, authority] = await retrieveAppConfiguration(envResponse[0], labClient, false);

        await stringReplacer.replace({
            "ENTER_CLIENT_ID_HERE": clientID
        });
    });

    afterAll(async () => {
        await stringReplacer.restore();
    });

    beforeEach(async () => {
        context = await browser.createIncognitoBrowserContext();
        page = await context.newPage();
        page.setDefaultTimeout(5000);
        BrowserCache = new BrowserCacheUtils(page, "localStorage");
    });

    afterEach(async () => {
        await page.close();
        await context.close();
    });

    it("Profile page - children are rendered after profile button clicked and logging in with loginRedirect", async () => {
        await page.goto(`http://localhost:${port}`);

        const testName = "profileButtonRedirectCase";
        const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
        await screenshot.takeScreenshot(page, "Page loaded");

        // Initiate Login via MsalGuard by clicking Profile
        const profileButton = await page.waitForSelector("xpath=//span[contains(., 'Profile')]");
        await profileButton.click();

        await enterCredentials(page, screenshot, username, accountPwd);

        // Verify UI now displays logged in content
        await page.waitForXPath("//button[contains(., 'Logout')]");
        await screenshot.takeScreenshot(page, "Profile page signed in");

        // Verify tokens are in cache
        await verifyTokenStore(BrowserCache, ["User.Read"]);

        // Verify displays profile page without activating MsalGuard
        await page.waitForXPath("//strong[contains(., 'First Name: ')]");
    });

    it("Profile page - children are rendered after initial navigation to profile before login ", async () => {
        // Initiate login via MsalGuard by navigating directly to profile route
        await page.goto(`http://localhost:${port}/#/profile`);

        const testName = "profileNavigationRedirectCase";
        const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
        await screenshot.takeScreenshot(page, "No home page load");

        await enterCredentials(page, screenshot, username, accountPwd);

        // Verify UI now displays logged in content
        await page.waitForXPath("//button[contains(., 'Logout')]");
        await screenshot.takeScreenshot(page, "Profile page signed in directly");

        // Verify tokens are in cache
        await verifyTokenStore(BrowserCache, ["User.Read"]);

        // Verify displays profile page without activating MsalGuard
        await page.waitForXPath("//strong[contains(., 'First Name: ')]");
    });
  }
);
