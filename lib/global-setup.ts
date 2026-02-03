import dotenv from 'dotenv';


async function globalSetup() {
    // Load test environment variables
    dotenv.config({ path: './env/.env.test' });
}

export default globalSetup;