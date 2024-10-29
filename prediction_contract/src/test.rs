#![cfg(test)]

use crate::market::*;
use soroban_sdk::{
    bytesn, Env, String
};

#[test]
fn test_initialize() {
    // Set up the test environment.
    let e = Env::default();
    let contract_id = e.register_contract(None, PredictionMarket);
    let client = PredictionMarketClient::new(&e, &contract_id);

    // Prepare the arguments.
    let token_wasm_hash = bytesn!(
        &e,
        0x2594a0fbfe5faa53c9c43cce19c7071f05f633009aca4db54f3572868b9a1359,
    );
    assert_eq!(token_wasm_hash.len(), 32);
    let outcome1 = "joe biden wins";
    let outcome2 = "trump wins";
    let desc = "outcome of presidential election";

    client.initialize(
        &token_wasm_hash,
        &String::from_str(&e, outcome1),
        &String::from_str(&e, outcome2),
        &String::from_str(&e, desc),
    );
}
