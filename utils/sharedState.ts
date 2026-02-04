export class SharedState {

    private static bookingId: number;
    private static token: string;

    static setBookingId(id: number) {
        this.bookingId = id;
    }

    static getBookingId(): number {
        return this.bookingId;
    }

    static setToken(token: string) {
        return this.token = token;
    }

    static getToken(): string {
        return this.token
    }
}