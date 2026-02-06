import BaseSteps from "./baseSteps";

export default class CheckoutSteps extends BaseSteps {

    async completeCheckoutFlow(productName: string, firstName: string, lastName: string, postalCode: string) {
        // Navigate to products page (already logged in via auth setup)
        await this.loginPage.goToLandingPage();

        // Add product to cart
        await this.productsPage.addProductToCart(productName);

        // Go to cart
        await this.productsPage.goToCart();
        await this.cartPage.verifyCartPage();

        // Proceed to checkout
        await this.cartPage.proceedToCheckout();

        // Fill checkout information
        await this.checkoutPage.fillCheckoutInformation(firstName, lastName, postalCode);
        await this.checkoutPage.clickContinue();

        // Finish checkout
        await this.checkoutPage.finishCheckout();
    }

    async verifyCheckoutSuccess(expectedMessage: string) {
        await this.checkoutPage.verifyCheckoutComplete(expectedMessage);
    }
}
