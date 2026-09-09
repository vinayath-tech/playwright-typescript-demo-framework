import { test, expect } from '@playwright/test';
import { SharedState } from '../../utils/sharedState';
import { updateBookingPayload, unauthorisedUpdatePayload } from '../../testdata/updateBookingData';

test.describe('Update booking using booking ID', () => {

    test('Update booking with valid token', async ({ request }) => {

        const bookingId = SharedState.getBookingId();
        const token = SharedState.getToken();

        const updateResponse = await request.put(`/booking/${bookingId}`, {
            headers: {
                'Cookie': `token=${token}`
            },
            data: updateBookingPayload
        });

        expect(updateResponse.status()).toBe(200);

        const responseBody = await updateResponse.json();
        console.log('Update Booking Response Body:', responseBody);

        // Validate every field came back updated
        expect(responseBody.firstname).toBe(updateBookingPayload.firstname);
        expect(responseBody.lastname).toBe(updateBookingPayload.lastname);
        expect(responseBody.totalprice).toBe(updateBookingPayload.totalprice);
        expect(responseBody.depositpaid).toBe(updateBookingPayload.depositpaid);
        expect(responseBody.bookingdates).toEqual(updateBookingPayload.bookingdates);
        expect(responseBody.additionalneeds).toBe(updateBookingPayload.additionalneeds);
    });

    test('Updated booking is persisted', async ({ request }) => {

        // The PUT response echoes the payload, so re-read the booking to prove
        // the update was actually stored rather than just reflected back.
        const bookingId = SharedState.getBookingId();

        const response = await request.get(`/booking/${bookingId}`);

        expect(response.status()).toBe(200);

        const responseBody = await response.json();
        expect(responseBody).toEqual(updateBookingPayload);
    });

    test('Update booking without token is rejected', async ({ request }) => {

        const bookingId = SharedState.getBookingId();

        const updateResponse = await request.put(`/booking/${bookingId}`, {
            data: unauthorisedUpdatePayload
        });

        expect(updateResponse.status()).toBe(403);
    });

    test('Update booking with invalid token is rejected', async ({ request }) => {

        const bookingId = SharedState.getBookingId();

        const updateResponse = await request.put(`/booking/${bookingId}`, {
            headers: {
                'Cookie': 'token=invalidtoken123'
            },
            data: unauthorisedUpdatePayload
        });

        expect(updateResponse.status()).toBe(403);
    });

    test('Booking is unchanged after rejected updates', async ({ request }) => {

        const bookingId = SharedState.getBookingId();

        const response = await request.get(`/booking/${bookingId}`);

        expect(response.status()).toBe(200);

        const responseBody = await response.json();
        expect(responseBody).toEqual(updateBookingPayload);
    });
});
