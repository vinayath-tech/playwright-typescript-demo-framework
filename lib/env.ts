export class ENV {

    //API creds
    public static API_VALID_USERNAME = process.env.API_VALID_USERNAME;
    public static API_VALID_PASSWORD = process.env.API_VALID_PASSWORD;
    public static API_INVALID_USERNAME = process.env.API_INVALID_USERNAME;
    public static API_INVALID_PASSWORD = process.env.API_INVALID_PASSWORD;

    //UI creds
    public static UI_VALID_USERNAME = process.env.UI_VALID_USERNAME;
    public static UI_VALID_PASSWORD = process.env.UI_VALID_PASSWORD
    public static UI_INVALID_USERNAME = process.env.UI_INVALID_USERNAME;
    public static UI_INVALID_PASSWORD = process.env.UI_INVALID_PASSWORD;
}