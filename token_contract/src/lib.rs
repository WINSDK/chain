#![no_std]

use soroban_sdk::xdr::ToXdr;
use soroban_sdk::{contracttype, symbol_short, Address, Bytes, BytesN, Env, Symbol};

mod test;
pub mod token;

pub const METADATA_KEY: Symbol = symbol_short!("METADATA");

pub fn create_contract(e: &Env, token_wasm_hash: BytesN<32>, token: &Address) -> Address {
    let mut salt = Bytes::new(e);
    salt.append(&token.to_xdr(e));
    let salt = e.crypto().sha256(&salt);
    e.deployer()
        .with_current_contract(salt)
        .deploy(token_wasm_hash)
}

#[contracttype]
pub enum DataKey {
    Admin,
    Balance(Address),
    Metadata(Symbol),
}
