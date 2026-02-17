import dotenv from 'dotenv';


async function globalSetup() {

    if(process.env.test_env === 'test') {
        dotenv.config({ path: './env/.env.test' });
    }
}

export default globalSetup;