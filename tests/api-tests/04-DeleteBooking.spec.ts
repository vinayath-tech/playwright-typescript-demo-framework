import { test, expect } from '@playwright/test';
import { SharedState } from '../../utils/sharedState';

test.describe('Delete Feature', () => {
    
    test('Delete booking using token & bookingId', async ({ request }) => {

        const bookingId = SharedState.getBookingId();
        const token = SharedState.getToken();

        const deleteResponse = await request.delete(`/booking/${bookingId}`, {
            headers:{
                'Cookie': `token=${token}`
            }
        });
        
        expect(deleteResponse.status()).toBe(201);

    });
});