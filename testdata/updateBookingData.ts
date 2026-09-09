export const updateBookingPayload = {
    "firstname": "Vinayath",
    "lastname": "Tech",
    "totalprice": 250,
    "depositpaid": false,
    "bookingdates": {
        "checkin": "2025-03-01",
        "checkout": "2025-03-15"
    },
    "additionalneeds": "Late checkout"
}

/** Payload used for the unauthorised-update checks — must never be persisted. */
export const unauthorisedUpdatePayload = {
    "firstname": "Unauthorised",
    "lastname": "Update",
    "totalprice": 1,
    "depositpaid": false,
    "bookingdates": {
        "checkin": "2025-01-01",
        "checkout": "2025-01-02"
    },
    "additionalneeds": "Should not be saved"
}
