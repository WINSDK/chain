import 'dotenv/config';
import { Keypair } from "@stellar/stellar-sdk";
import { execSync } from 'child_process';

// Function to execute and log shell commands
function exe(command) {
    console.log(command);
    execSync(command, { stdio: 'inherit' });
  }

// run to generate account key pair
async function generateAcc() {
    const kp = Keypair.random();
    const secret = kp.secret();
    const pubKey = kp.publicKey();
    console.log("pubKey: ", pubKey);
    console.log("secret: ", secret);
    // add to env variables
}

// generateAcc();

// run to fund account for testnet use
async function fundAccount() {
    try {
        const response = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(process.env.PUBLIC_SOROBAN_PK)}`);
        await response.json();
        console.log('Account has been funded!');
    }
    catch (e) {
        console.log("Error:", e);
    }
}

// fundAccount()

// run to save the account as an identity
async function storeAccount() {
    try {
        exe(`soroban keys add ABOBA --secret-key ${process.env.SOROBAN_SECRET}`);
        console.log("Keys stored.");
    }
    catch (e) {
        console.log("Error:", e);
    }
}

// storeAccount();