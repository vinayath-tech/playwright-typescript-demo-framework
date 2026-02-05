import { Page } from "@playwright/test";
import { LoginPage } from "../pageFactory/loginPage";

export default class BaseSteps {
    
    readonly page: Page;
    readonly loginPage: LoginPage;

    constructor(page: Page) {
        this.page = page;
        this.loginPage = new LoginPage(this.page);
    }
}