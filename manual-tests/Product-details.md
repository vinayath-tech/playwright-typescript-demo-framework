## Scenario 1 - As a customer, verify user can learn more about the product in the /details page
- Given I navigate to `https://www.saucedemo.com/`
- And I login with UI_VALID_USERNAME & UI_VALID_PASSWORD creds
- When I click on `Sauce Labs Bolt T-Shirt` item
- Then I should be navigated to a Product detail page containing Item description
- Verify the page displays the description of the product along with Price & option to add the product to cart