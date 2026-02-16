import dotenv from 'dotenv';
import * as fs from 'fs';


async function globalSetup() {
    // Load test environment variables from file only if not already set in environment
    // This allows GitHub Actions to pass secrets as environment variables
    const envFilePath = './env/.env.test';

    if (fs.existsSync(envFilePath)) {
        dotenv.config({ path: envFilePath });
    }

    // Log whether variables are loaded (without showing values for security)
    console.log('Environment variables loaded:');
    console.log('- API_VALID_USERNAME:', process.env.API_VALID_USERNAME ? 'Set' : 'Not set');
    console.log('- API_VALID_PASSWORD:', process.env.API_VALID_PASSWORD ? 'Set' : 'Not set');
}

export default globalSetup;