import * as dotenv from 'dotenv';
import path from "path";
import { Keypair } from "@stellar/stellar-sdk";
import { execSync } from 'child_process';

dotenv.config({ path: path.resolve(process.cwd(), "dapp/.env")});

/*
* Utility functions to execute admin actions such as setting up accounts,
* deploying and initialisation of important contracts. Run by un-commenting 
* the desired function and ts-node this file. Do not run or call this from 
* the frontend.
*/

// Function to execute and log shell commands
function exe(command) {
    console.log(command);
    const output = execSync(command, { stdio: 'inherit' });
    return output;
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

// fundAccount();

// run to deploy the prediction contract from the built wasm in
async function setupPredictionContract() {
    try {
        console.log(process.cwd());

        exe(`stellar contract build \
            --manifest-path dapp/contracts/prediction_contract/Cargo.toml`
        );

        exe(`stellar contract deploy \
            --wasm dapp/target/wasm32-unknown-unknown/release/prediction_contract.wasm \
            --source ${process.env.PUBLIC_SOROBAN_IDENTITY} \
            --network ${process.env.PUBLIC_SOROBAN_NETWORK}`
        );

        console.log("^ Save this contract ID above");
    }
    catch (e) {
        console.log("Error:", e);
    }
}

// setupPredictionContract();

// run with the contract ID to invoke the init function and start 
// the contract with a specified duration in seconds
async function initContract(contractId: String, duration: Number) {
    exe(`stellar contract invoke \
        --id ${contractId}\
        --source ${process.env.PUBLIC_SOROBAN_IDENTITY} \
        --network ${process.env.PUBLIC_SOROBAN_NETWORK} \
        -- \
        init \
        --admin ${process.env.PUBLIC_SOROBAN_PK} \
        --duration ${duration}` 
    );
}

// replace these values for each contract you want to initialise
const contractId = ""
const duration = 1000000;  // 11.5 days approx.
// initContract(contractId, duration);