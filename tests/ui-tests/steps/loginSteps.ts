import BaseSteps from "./baseSteps";

export default class LoginSteps extends BaseSteps {

    async verifyValidLogin(expectedText: string) {
        await this.loginPage.goToLandingPage();
        await this.loginPage.verifyLoginSuccess(expectedText);
    }

    async verifyInvalidLogin() {
        await this.loginPage.goToLoginPage();
        await this.loginPage.verifyLoginFailure();
    }
}