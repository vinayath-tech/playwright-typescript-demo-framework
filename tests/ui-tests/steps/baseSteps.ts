import { Page } from "@playwright/test";
import { LoginPage } from "../pageFactory/loginPage";
import { ProductsPage } from "../pageFactory/productsPage";
import { CartPage } from "../pageFactory/cartPage";
import { CheckoutPage } from "../pageFactory/checkoutPage";
import { InventoryPage } from "../pageFactory/inventoryPage";
import { ProductDetailsPage } from "../pageFactory/productDetailsPage";

export default class BaseSteps {

    readonly page: Page;
    readonly loginPage: LoginPage;
    readonly productsPage: ProductsPage;
    readonly cartPage: CartPage;
    readonly checkoutPage: CheckoutPage;
    readonly inventoryPage: InventoryPage;
    readonly productDetailsPage: ProductDetailsPage;

    constructor(page: Page) {
        this.page = page;
        this.loginPage = new LoginPage(this.page);
        this.productsPage = new ProductsPage(this.page);
        this.cartPage = new CartPage(this.page);
        this.checkoutPage = new CheckoutPage(this.page);
        this.inventoryPage = new InventoryPage(this.page);
        this.productDetailsPage = new ProductDetailsPage(this.page);
    }
}