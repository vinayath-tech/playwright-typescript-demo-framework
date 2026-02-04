import { test, expect } from '@playwright/test';
import { SharedState } from '../../utils/sharedState';
import { bookingPayload } from '../../testdata/createBookingData';

test.describe('Get booking details using booking ID', () => {

    test('Fetch booking details', async ({ request }) => {

        // Retrieve bookingId from SharedState
        const bookingId =  SharedState.getBookingId();
        const response = await request.get(`/booking/${bookingId}`);

        expect(response.status()).toBe(200);

        const responseBody = await response.json();
        console.log('Get Booking Response Body:', responseBody);

        // Validate booking details
        expect(responseBody).toHaveProperty('firstname');
        expect(responseBody).toHaveProperty('lastname');
        expect(responseBody).toHaveProperty('totalprice');

        //Verify response data matches the created booking data
        expect(responseBody.firstname).toEqual(bookingPayload.firstname);
        expect(responseBody.lastname).toEqual(bookingPayload.lastname);
        expect(responseBody.totalprice).toEqual(bookingPayload.totalprice);
    });
});