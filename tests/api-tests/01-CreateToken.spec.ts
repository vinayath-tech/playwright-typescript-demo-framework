import { test, expect } from '@playwright/test';
import { ENV } from '../../lib/env';

test.describe('Create token for authentication test', () => {

    test('Create token with valid credentials', async ({ request }) => {

        const apiUname = ENV.API_VALID_USERNAME;
        const apiPwd = ENV.API_VALID_PASSWORD;

        const response = await request.post('/auth', {
            data: {
                "username": `${apiUname}`,
                "password": `${apiPwd}`
            }

        });

        expect(response.status()).toBe(200);

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('token');
    });

    test('Create token with invalid Credentials', async({ request}) =>{
        const response = await request.post('/auth', {
            data: {
                "username": ENV.API_INVALID_USERNAME,
                "password": ENV.API_INVALID_PASSWORD
            }
        });

        expect(response.status()).toBe(200);

        const responseBody = await response.json();
        expect(responseBody).not.toHaveProperty('token');
        expect(responseBody).toHaveProperty('reason');
        expect(responseBody.reason).toContain('Bad credentials');
    });

});