import { test, expect } from '@playwright/test';

test.describe('Get all booking IDs', () => {

    test('Fetch all booking IDs', async ({ request }) => {

        const response = await request.get('/booking');

        expect(response.status()).toBe(200);

        const responseBody = await response.json();
        console.log('Get All Booking IDs Response:', responseBody);

        // Validate response is an array
        expect(Array.isArray(responseBody)).toBe(true);

        // Validate that the response contains at least one booking
        expect(responseBody.length).toBeGreaterThan(0);

        // Validate the structure of each booking ID object
        if (responseBody.length > 0) {
            const firstBooking = responseBody[0];
            expect(firstBooking).toHaveProperty('bookingid');
            expect(typeof firstBooking.bookingid).toBe('number');
        }
    });
});
