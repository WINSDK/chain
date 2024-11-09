import * as dotenv from 'dotenv';
import path from "path";
import { execSync } from 'child_process';
import { select, Separator, input, number } from '@inquirer/prompts';
import editJsonFile from "edit-json-file";
import fs from 'fs';
dotenv.config({ path: path.resolve(process.cwd(), "dapp/.env")});

/*
* Utility functions to execute admin actions such as setting up accounts,
* deploying and initialisation of important contracts. Run by un-commenting 
* the desired function and ts-node this file. Do not run or call this from 
* the frontend.
*/

// Function to execute and log shell commands
function exe(command) {
    try {
        const output = execSync(command, { stdio: 'inherit' });
        return output; 
    }
    catch (e) {
        console.log(e);
    }
    
}

// run to fund account for testnet use
async function fundAccount(accountId: string) {
    try {
        const response = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(accountId)}`);
        await response.json();
        console.log('Account has been funded!');
    }
    catch (e) {
        console.log("Error:", e);
    }
}

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

async function editMarkets(contractId: String) {
    // add to the /data/markets.json file
    let adminId = process.env.PUBLIC_SOROBAN_PK;    

    // take user input for the market entry
    let inputTitle = await input({
        message: 'Enter the prediction title:',
        required: true,
    });
    let inputDesc = await input({
        message: 'Enter the prediction description:',
        required: true,
    });
    let inputOpt1 = await input({
        message: 'Enter the name of OPT1:',
        required: true,
    });
    let inputOpt2 = await input({
        message: 'Enter the name of OPT2:',
        required: true,
    });

    const filePath = path.join(process.cwd(), "/dapp/src/data/markets.json");
    
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return;
        }
        try {
            // Parse the JSON data
            const jsonData = JSON.parse(data);
            const newEntry = {
                "title": inputTitle,
                "imageUrl": "",
                "description": inputDesc,
                "betOptions": [inputOpt1, inputOpt2],
                "betPercentage": [50, 50],
                "contractId": contractId,
                "adminId": adminId,
            };

            // Update the data
            jsonData.push(newEntry);

            // Write the updated data back to the file
            fs.writeFile(filePath, JSON.stringify(jsonData), (err) => {
                if (err) {
                    console.error('Error writing file:', err);
                    return;
                }
                console.log(newEntry);
                console.log('\nData updated successfully.');
            });
        } catch (error) {
            console.error('Error parsing JSON data:', error);
        }
    });
}

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

    editMarkets(contractId);
}

// run with the contract ID and either "OPT1" or "OPT2" to select the winner
// and close the prediction market contract
async function closeContract(contractId: String, winner: String) {
    exe(`stellar contract invoke \
        --id ${contractId}\
        --source ${process.env.PUBLIC_SOROBAN_IDENTITY} \
        --network ${process.env.PUBLIC_SOROBAN_NETWORK} \
        -- \
        close \
        --admin ${process.env.PUBLIC_SOROBAN_PK} \
        --winner ${winner}` 
    );
}

/*
* Menu for calling above functions. Admins will run this file to configure, deploy,
* initialise and close market contracts. Uses the admin keys found in .env by default.
*/

const answer = await select({
    message: 'Select an admin function:',
    choices: [
      {
        name: 'Setup prediction contract',
        value: '1',
        description: 'Set up the contract in the Stellar testnet',
      },
      {
        name: 'Initialise prediction contract',
        value: '2',
        description: 'Initialise and open voting process for a contract',
      },
      {
        name: 'Close prediction contract',
        value: '3',
        description: 'Close voting and select a winner for a contract'
      },
      {
        name: 'Fund Account',
        value: '4',
        description: 'Utility to call Friendbot for extra testnet XLM'
        
      },
      new Separator(),
    ],
});

switch (answer) {
    case '1': {
        await setupPredictionContract();
        break;
    }
    case '2': {
        let contractId = await input({
            message: 'Enter the contract ID:',
            required: true,
            transformer(value, { isFinal }) {
                value.toUpperCase();
                isFinal;
                return value;
            },
            validate(value) {
                if (value.length != 56) {
                    return 'Length must be 56 chars';
                }
                else if (value.charAt(0) != 'C') {
                    return 'contract ID must start with "C"';
                }
                return true;
            }
        });
        contractId.toUpperCase();
        let duration = await number({
            message: 'Enter the market open duration in seconds:',
            required: true,
            min: 1,
            default: 100000,
        });
        await initContract(contractId, duration);
        break;
    }
    case '3': {
        let contractId = await input({
            message: 'Enter the contract ID:',
            required: true,
            transformer(value, { isFinal }) {
                value.toUpperCase();
                isFinal;
                return value;
            },
            validate(value) {
                if (value.length != 56) {
                    return 'Length must be 56 chars';
                }
                else if (value.charAt(0) != 'C') {
                    return 'contract ID must start with "C"';
                }
                return true;
            }
        });
        contractId.toUpperCase();
        let winner = await input({
            message: 'Enter the contract ID:',
            required: true,
            transformer(value, { isFinal }) {
                value.toUpperCase();
                isFinal;
                return value;
            },
            validate(value) {
                if (value != 'OPT1' || 'OPT2') {
                    return 'Invalid winner, must be "OPT1" or "OPT2"';
                }
                return true;
            }
        });
        winner.toUpperCase();
        await closeContract(contractId, winner);
        break;
    }
    case '4': {
        fundAccount(process.env.PUBLIC_SOROBAN_PK);
        break;
    }
    default: {
        console.log("Invalid input!");
        break;
    }
}