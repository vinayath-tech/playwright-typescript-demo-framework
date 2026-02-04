import { faker } from '@faker-js/faker';


export const bookingPayload = {
    "firstname": "Gokul",
    "lastname": "Sridharan",
    "totalprice": 100,
    "depositpaid": true,
    "bookingdates": {
        "checkin": "2024-06-01",
        "checkout": "2024-06-10"
    },
    "additionalneeds": "Breakfast"
}