import {test, expect} from '@playwright/test';
import { bookingPayload } from '../../testdata/createBookingData';
import { SharedState } from '../../utils/sharedState';

test.describe('Create a new booking', () => {

    let bookingId: number;
    test('Valid booking creation', async ({ request }) => {

        const bookingResponse = await request.post('/booking', {
            data: bookingPayload
        });

        expect(bookingResponse.status()).toBe(200);

        const responseBody =  await bookingResponse.json();
        console.log('Booking Response Body:', responseBody);

        //Extract booking id
        bookingId = responseBody.bookingid;
        console.log('Created Booking ID:', bookingId);

        // Store bookingId in SharedState for use in other tests
        SharedState.setBookingId(bookingId);

        expect(responseBody).toHaveProperty('bookingid');
        expect(responseBody).toHaveProperty('booking');

        // Validate booking details
        const bookingDetails = responseBody.booking;
        expect(bookingDetails.firstname).toBe(bookingPayload.firstname);
        expect(bookingDetails.lastname).toBe(bookingPayload.lastname);
        expect(bookingDetails.totalprice).toBe(bookingPayload.totalprice);
    });
});