## Scenario 1 - As a customer, verify Products can be added/removed from shopping cart
Given I navigate to `https://www.saucedemo.com/`
And I login with UI_VALID_USERNAME & UI_VALID_PASSWORD creds
When I click on `Sauce Labs Bolt T-Shirt` item
Then I should be navigated to a Product detail page containing Item description
When I click `Add to cart` button
Then the product should be added to the cart
When I click on shopping cart icon on the page
Then I should be navigated to the cart page
When I remove the product from cart using the `Remove` link
Then the cart should be empty
