import Types from '@stellar/freighter-api';
import { Asset, Contract, BASE_FEE, SorobanRpc, Transaction, TransactionBuilder, Account, Address, xdr, Keypair, Operation, Networks, nativeToScVal, scValToNative } from "@stellar/stellar-sdk";
import { getAddress, signTransaction } from '@stellar/freighter-api';
import exec from 'sync-exec';

// Function to execute and log shell commands
function exe(command) {
    console.log(command);
    try {
        // const output = execSync(command, { stdio: 'pipe', maxBuffer: 1024 * 1024 }).toString();
        const output = exec(command, { stdio: 'pipe', maxBuffer: 1024 * 1024 });
        if (output.stderr) {
            throw new Error('Error executing cmd:', output.stderr);
        }
        return output.stdout;
    }
    catch (err: any) {
        console.log(err);
    } 
}

/*
* This function is for read only contracts, and uses the test
* account for invocation.
*/
export async function CallContract(
    sourceAcc: Account, 
    sourceKp: Keypair,
    networkPass: string, 
    server: SorobanRpc.Server,
    sourceContract: Contract,
    method: string,
    ...params: xdr.ScVal[]
) {
    // builds, signs and sends the transaction
    const tx = new TransactionBuilder(sourceAcc, {
        fee: BASE_FEE,
        networkPassphrase: networkPass,
    })
    .addOperation(sourceContract.call(method, ...params))
    .setTimeout(30)
    .build();

    let prepTx = await server.prepareTransaction(tx);
    prepTx.sign(sourceKp);

    try {
        let sendResponse = await server.sendTransaction(prepTx);
        console.log(`Sent transaction: ${JSON.stringify(sendResponse, null, " ")}`);

        // check if the tx was sent properly
        if (sendResponse.status === "PENDING") {
            let getResponse = await server.getTransaction(sendResponse.hash);

            // Poll `getTransaction` until the status is not "NOT_FOUND"
            while (getResponse.status === "NOT_FOUND") {
                console.log("Waiting for transaction confirmation...");
                getResponse = await server.getTransaction(sendResponse.hash);
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }

            console.log(`getTransaction response: ${JSON.stringify(getResponse, null, " ")}`);

            if (getResponse.status === "SUCCESS") {
                // Make sure the transaction's resultMetaXDR is not empty
                if (!getResponse.resultMetaXdr) {
                    throw "Empty resultMetaXDR in getTransaction response";
                }
                // Find the return value from the contract and return it
                let transactionMeta = getResponse.resultMetaXdr;
                let returnValue = transactionMeta.v3().sorobanMeta()!.returnValue();
                console.log(`Transaction result: ${returnValue.value()}`);
                return returnValue;
            } else {
                throw `Transaction failed: ${getResponse.resultXdr}`;
            }
        } else {
            throw sendResponse.errorResult;
        }
    } catch (err) {
        console.log("Sending transaction failed");
        console.log(JSON.stringify(err, null, " "));
        return null;
    }
}

/*
* This function is called for contract invocations requiring the 
* user to sign with their wallet account. Uses Freighter API.
*/
export async function CallSignContract(
    sourceAcc: Account,
    networkPass: string, 
    server: SorobanRpc.Server,
    sourceContract: Contract,
    method: string,
    ...params: xdr.ScVal[]
) {
    // builds, signs and sends the transaction
    const tx = new TransactionBuilder(sourceAcc, {
        fee: BASE_FEE,
        networkPassphrase: networkPass,
    })
    .addOperation(sourceContract.call(method, ...params))
    .setTimeout(30)
    .build();
    
    const prepTx = await server.prepareTransaction(tx);
    const signedXdr = await Types.signTransaction(prepTx.toXDR(), {
        networkPassphrase: networkPass,
        address: sourceAcc.accountId()
    });
    alert("Tx signed successfully.");

    const signedTx = TransactionBuilder.fromXDR(signedXdr.signedTxXdr, networkPass) as Transaction;

    try {
        let sendResponse = await server.sendTransaction(signedTx);
        console.log(`Sent transaction: ${JSON.stringify(sendResponse, null, " ")}`);

        // check if the tx was sent properly
        if (sendResponse.status === "PENDING") {
            let getResponse = await server.getTransaction(sendResponse.hash);

            // Poll `getTransaction` until the status is not "NOT_FOUND"
            while (getResponse.status === "NOT_FOUND") {
                console.log("Waiting for transaction confirmation...");
                getResponse = await server.getTransaction(sendResponse.hash);
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }

            console.log(`getTransaction response: ${JSON.stringify(getResponse, null, " ")}`);

            if (getResponse.status === "SUCCESS") {
                // Make sure the transaction's resultMetaXDR is not empty
                if (!getResponse.resultMetaXdr) {
                    throw "Empty resultMetaXDR in getTransaction response";
                }
                // Find the return value from the contract and return it
                let transactionMeta = getResponse.resultMetaXdr;
                let returnValue = transactionMeta.v3().sorobanMeta()!.returnValue();
                console.log(`Transaction result: ${returnValue.value()}`);
                return returnValue;
            } else {
                throw `Transaction failed: ${getResponse.resultXdr}`;
            }
        } else {
            throw sendResponse.errorResult;
        }
    } catch (err) {
        console.log("Sending signed transaction failed");
        console.log(JSON.stringify(err, null, " "));
        return null;
    }
}

/*
* This function is for payment transactions. Amount is specified in 
* string format and can be up to 7 d.p. representation.
* Custom assets can be sent by specifying a code and issuer pair.
*/
export async function CallPayment(
    sourceAcc: Account,
    networkPass: string, 
    server: SorobanRpc.Server,
    destination: string,
    sendAmount: string,
    sendAsset: Asset,
) {
    const tx = new TransactionBuilder(sourceAcc, {
        fee: BASE_FEE,
        networkPassphrase: networkPass,
    })
    .addOperation(Operation.payment({
        destination: destination,
        amount: sendAmount,
        asset: sendAsset,
    }))
    .setTimeout(30)
    .build();
    const prepTx = await server.prepareTransaction(tx);
    const signedXdr = await Types.signTransaction(prepTx.toXDR(), {
        networkPassphrase: networkPass,
        address: sourceAcc.accountId()
    });
    alert("Tx signed successfully.");

    const signedTx = TransactionBuilder.fromXDR(signedXdr.signedTxXdr, networkPass) as Transaction;

    try {
        let sendResponse = await server.sendTransaction(signedTx);
        console.log(`Sent payment: ${JSON.stringify(sendResponse, null, " ")}`);

    } catch (err) {
        console.log("Sending payment failed");
        console.log(JSON.stringify(err, null, " "));
        return null;
    }
}

/*
* This function takes in the contract ID and the key of the data to access,
* then returns the data representation after querying the contract using
* Soroban RPC. 
* This function will only return the first data entry in the array.
*/
export async function CallContractData(contractId: string, symbolText: string) {
    console.log("CallContractData:", contractId, symbolText);
    const ledgerKey = xdr.LedgerKey.contractData(
        new xdr.LedgerKeyContractData({
          contract: new Address(contractId).toScAddress(),
          key: xdr.ScVal.scvSymbol(symbolText),
          durability: xdr.ContractDataDurability.persistent(),
        }),
    );
    const keySymbol = ledgerKey.toXDR("base64");
    console.log(keySymbol);

    let requestBody = {
    "jsonrpc": "2.0",
    "id": 8675309,
    "method": "getLedgerEntries",
    "params": {
        "keys": [keySymbol]
        }
    }
    try {
        let res = await fetch('https://soroban-testnet.stellar.org', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        })
        let json = await res.json()
        const dataArr = json.result.entries;
        console.log(dataArr);

        // get the xdr, parse from the base64 string
        const parsed = xdr.LedgerEntryData.fromXDR((dataArr[0].xdr.toString()), "base64");
        // const key = parsed['_value']['_attributes']['key']['_value'];
        const val = parsed['_value']['_attributes']['val']['_value'];

        return val;
    }
    catch (err) {
        console.log("CallContractData:", err);
        return null;
    }
}

/*
* These functions will be called by the dapp frontend to interact with the
* prediction contract. After building the invocations, the functions above
*  will be called to send the transaction needed.
*/

// define objects corresponding to the return structs (for reference)
interface Prediction {
    has_init: number,
    start_t: number,
    end_t: number,
    opt_1: number,
    opt_2: number,
    total: number,
    winner: string,
}

interface Voter {
    selected: string,
    time: number,
    votes: number,
}

// define enum for OPT1 and OPT2 selections 
enum Selections {
    OPT1 = 'OPT1',
    OPT2 = 'OPT2',
}

// invokes view_predictions to retrieve the PredictionRecord data
export async function ViewPredictionData(contractId: string) {
    // initialise server and contract
    const server = new SorobanRpc.Server(import.meta.env.PUBLIC_SOROBAN_RPC_URL);
    const predictionContract = new Contract(contractId);
    const kp = Keypair.fromSecret(import.meta.env.PUBLIC_SOROBAN_SECRET);
    const account = await server.getAccount(kp.publicKey());

    if (kp.publicKey() == undefined) {
        alert("Problem retrieving address from backend!");
        return;
    }

    // builds, signs and sends the transaction using the test account keypair
    const contractResp = await CallContract(
        account,
        kp,
        Networks.TESTNET,
        server,
        predictionContract,
        "view_predictions",
    );
    if (contractResp == null) {
        alert("Issue with invoking view_prediction()");
    } else {
        // parse result
        let result = scValToNative(contractResp);
        console.log(result);
        return result;
    }
}

// invokes view_voter to retrieve the Record data for the current Freighter address
export async function ViewVoter(contractId: string) {
    // initialise server and contract
    const server = new SorobanRpc.Server(import.meta.env.PUBLIC_SOROBAN_RPC_URL);
    const predictionContract = new Contract(contractId);
    const kp = Keypair.fromSecret(import.meta.env.PUBLIC_SOROBAN_SECRET);
    const account = await server.getAccount(kp.publicKey());
    const addressObj = await getAddress();

    if (kp.publicKey() == undefined) {
        alert("Problem retrieving address from backend!");
        return;
    }
    else if (addressObj.error) {
        alert("Problem retrieving address from Freighter! Please check the extension.");
        return;
    }

    // marshal voter address string into to ScVal
    const voterAddress = Address.fromString(addressObj.address).toScVal();

    // builds, signs and sends the transaction using the test account keypair
    const contractResp = await CallContract(
        account,
        kp,
        Networks.TESTNET,
        server,
        predictionContract,
        "view_voter",
        voterAddress
    );
    if (contractResp == null) {
        alert("Issue with invoking view_voter()");
    } else {
        // parse result
        let result = scValToNative(contractResp);
        console.log(result);
        return result;
    }
}

// invokes record_votes to send the vote to the ledger, then invokes CallPayment
// for the user to send the required XLM to the contract
export async function RecordVotes(contractId: string, adminId: string, selected: string, votes: number) {
    if (!(Object.values(Selections).includes(selected as Selections))) {
        console.log("input must be OPT1 or OPT2");
    }
    else {
        // initialise server and contract
        const server = new SorobanRpc.Server(import.meta.env.PUBLIC_SOROBAN_RPC_URL);
        const predictionContract = new Contract(contractId);
        // get voter address from Freighter
        const addressObj = await getAddress();
        if (addressObj.error) {
            alert("Problem retrieving address from Freighter! Please check the extension.");
            return;
        }
        // initialise test account for non-transaction calls
        const account = await server.getAccount(addressObj.address);
        // marshal voter address string into to ScVal
        const voterAddress = Address.fromString(addressObj.address).toScVal();

        const contractResp = await CallSignContract(
            account,
            Networks.TESTNET,
            server,
            predictionContract,
            "record_votes",
            voterAddress,
            nativeToScVal(selected, {type:"symbol"}),
            nativeToScVal(votes, {type:"u64"}),
        )
        if (contractResp == null) {
            console.log("selected:", selected);
            console.log("votes:", votes);
            alert("Issue with invoking record_votes()");
        } else {
            alert(JSON.stringify(contractResp));
            console.log(contractResp);
        }

        // send payment to contract admin in native XLM corresponding to sent votes
        const sendAmount = votes.toString();
        const paymentResp = await CallPayment(
            account,
            Networks.TESTNET,
            server,
            adminId,
            sendAmount,
            Asset.native(),
        )
        if (paymentResp == null) {
            alert("Issue with sending payment");
        } else {
            alert(JSON.stringify(paymentResp));
            console.log(paymentResp);
        }
    }
}