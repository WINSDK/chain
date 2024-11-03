import { Asset, Contract, BASE_FEE, SorobanRpc, Transaction, TransactionBuilder, Account, Address, xdr, Keypair, Operation, } from "@stellar/stellar-sdk";

/*
* 
*/
export async function CallEvents(contractId: string, topics: string[], ledgerCount: string) {
    // check number of topics in array (max 4 in a request)
    const topicNumber = topics.length;
    if (topicNumber > 4) {
        console.log("CallEvents: Too many topics passed! (4 max.)")
        return null;
    }
    console.log("CallEvents:\n");
    // serialise topic strings into XDR (base64 representation)
    topics.forEach((topic, index) => {
        topics[index] = xdr.ScVal.scvSymbol(topic).toXDR("base64");
    });

    // if number of topics below 4 add "*" padding
    while (topics.length < 4) {
        topics.push("*");
    }
    console.log(topics);

    // get latest ledger, then subtract by specified number to get start point
    let requestBody = {
        "jsonrpc": "2.0",
        "id": 8675309,
        "method": "getLatestLedger"
    }
    let res = await fetch('https://soroban-testnet.stellar.org', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
    })
    let json = await res.json()

    const latestLedger = json.result.sequence;
    const startLedger = Number(latestLedger) - Number(ledgerCount);
    console.log(startLedger + " to " + latestLedger);

    // form getEvents request
    let eventRequestBody = {
        "jsonrpc": "2.0",
        "id": 8675309,
        "method": "getEvents",
        "params": {
          "startLedger": startLedger,
          "filters": [
            {
              "type": "contract",
              "contractIds": [contractId],
              "topics": [topics]
            }
          ],
          "pagination": {
            "limit": 2
          }
        }
      }
      let eventResponse = await fetch('https://soroban-testnet.stellar.org', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventRequestBody),
      })
      let eventJson = await eventResponse.json()
      console.log(eventJson)
      return eventJson.result.events;
}