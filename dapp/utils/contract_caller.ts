import Types from '@stellar/freighter-api';
import { Asset, Contract, BASE_FEE, SorobanRpc, Transaction, TransactionBuilder, Account, xdr, Keypair, Operation } from "@stellar/stellar-sdk";

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