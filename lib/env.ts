export class ENV {

    //API creds
    public static get API_VALID_USERNAME() { return process.env.API_VALID_USERNAME; }
    public static get API_VALID_PASSWORD() { return process.env.API_VALID_PASSWORD; }
    public static get API_INVALID_USERNAME() { return process.env.API_INVALID_USERNAME; }
    public static get API_INVALID_PASSWORD() { return process.env.API_INVALID_PASSWORD; }

    //UI creds
    public static UI_VALID_USERNAME = process.env.UI_VALID_USERNAME;
    public static UI_VALID_PASSWORD = process.env.UI_VALID_PASSWORD
    public static UI_INVALID_USERNAME = process.env.UI_INVALID_USERNAME;
    public static UI_INVALID_PASSWORD = process.env.UI_INVALID_PASSWORD;

    //Self-healing locator strategy
    public static get SELF_HEALING_ENABLED() { return process.env.SELF_HEALING_ENABLED; }
    public static get SELF_HEALING_AI_ENDPOINT() { return process.env.SELF_HEALING_AI_ENDPOINT; }
    public static get SELF_HEALING_AI_KEY() { return process.env.SELF_HEALING_AI_KEY; }
    public static get SELF_HEALING_AI_MODEL() { return process.env.SELF_HEALING_AI_MODEL; }
    public static get SELF_HEALING_PAGE_FACTORY_DIR() { return process.env.SELF_HEALING_PAGE_FACTORY_DIR; }
    public static get SELF_HEALING_CACHE_PATH() { return process.env.SELF_HEALING_CACHE_PATH; }
    public static get SELF_HEALING_MODE() { return process.env.SELF_HEALING_MODE; }
    public static get SELF_HEALING_QUEUE_PATH() { return process.env.SELF_HEALING_QUEUE_PATH; }
}