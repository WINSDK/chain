import Types from '@stellar/freighter-api';
import { Asset, Contract, BASE_FEE, SorobanRpc, Transaction, TransactionBuilder, Account, Address, xdr, Keypair, Operation, } from "@stellar/stellar-sdk";
import { Durability } from '@stellar/stellar-sdk/rpc';
import { symbol } from 'astro:schema';
import { execSync } from 'child_process';

// Function to execute and log shell commands
function exe(command) {
    console.log(command);
    try {
        const output = execSync(command, { stdio: 'pipe', maxBuffer: 1024 * 1024 }).toString();
        return output;
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
    // server = new SorobanRpc.Server(import.meta.env.PUBLIC_SOROBAN_RPC_URL);
    // sourceAcc = await server.getAccount((await Types.getAddress()).address);
    // sourceContract = new Contract(import.meta.env.PUBLIC_INCREMENT_CONTRACT_ID);
    // builds, signs and sends the transaction
    const tx = new TransactionBuilder(sourceAcc, {
        fee: BASE_FEE,
        networkPassphrase: networkPass,
    })
    .addOperation(sourceContract.call(method, ...params))
    .setTimeout(30)
    .build();
    
    const prepTx = await server.prepareTransaction(tx);
    const signedXdr  = await Types.signTransaction(prepTx.toEnvelope().toXDR("base64"), {
        networkPassphrase: networkPass
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
    if (sendAsset.issuer == null) {
        sendAsset = Asset.native();
    }
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
    const signedXdr  = await Types.signTransaction(prepTx.toEnvelope().toXDR("base64"), {
        networkPassphrase: networkPass
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

export async function CallEvents() {
    
}

export async function CallContractData(contractId: string, symbolText?: string) {
    const output = exe(`stellar contract read \
        --id ${contractId} \
        --network ${import.meta.env.PUBLIC_SOROBAN_NETWORK} \
        --source ${import.meta.env.PUBLIC_SOROBAN_PK} \
        --durability persistent \
        --output json`
    );

    // split the output by their commas, combine item indexes 1,2,3
    var outputArr = new Array();
    output.split(",").forEach(function(outputStr) {
        // remove all leading and trailing double-double quotes ""%s""
        outputStr = outputStr.replaceAll('""', '"');
        outputArr.push(outputStr);
    });
    var data = outputArr[1] + ",\n" + outputArr[2] + ",\n" + outputArr[3];
    data = data.substring(1, data.length-1);
    const dataJson = JSON.parse(data);
    
    // rebuild new object using the values
    interface contractData {
        key: string;
        val: any;
    }
    let contractDataArr = Array();
    // iterate through the storage, unmarshal key symbol and value
    const obj = dataJson["contract_instance"]["storage"];
    for (let i=0; i < obj.length; i++) {
        const k = Object.values(Object.values(obj[i])[0])[0];
        const v = Object.values(Object.values(obj[i])[1])[0];
        let foo:contractData = {
            key: k,
            val: v
        };
        contractDataArr.push(foo);
    }
    console.log(contractDataArr);

    // search for symbol key, if specified
    if (typeof symbolText !== 'undefined') {
        console.log("Search key:", symbolText);
        let found = contractDataArr.find(element => element.key === symbolText);
        console.log("Val:", found.val);
        return found;
    }
    // if not specified, return all entries
    return contractDataArr;
}