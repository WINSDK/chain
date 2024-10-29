use soroban_sdk::{xdr::ToXdr, Address, Bytes, BytesN, Env, String};

soroban_sdk::contractimport!(
    file = "../token_contract/target/wasm32-unknown-unknown/release/token_contract.optimized.wasm"
);

pub fn create_contract(
    e: &Env,
    token_wasm_hash: &BytesN<32>,
    market_id: &Bytes,
    outcome: &String,
) -> Address {
    let mut salt = Bytes::new(e);
    salt.append(&outcome.clone().to_xdr(e));
    salt.append(&market_id.clone().to_xdr(e));
    let salt = e.crypto().sha256(&salt);
    e.deployer()
        .with_current_contract(salt)
        .deploy(token_wasm_hash.clone())
}
