#![no_std]

use soroban_sdk::xdr::ToXdr;
use soroban_sdk::{contracterror, contracttype, symbol_short, Address, Bytes, BytesN, Env, Symbol};

mod test;
pub mod token;

pub const DAY_IN_LEDGERS: u32 = 17280;
pub const INSTANCE_BUMP_AMOUNT: u32 = 7 * DAY_IN_LEDGERS;
pub const INSTANCE_LIFETIME_THRESHOLD: u32 = INSTANCE_BUMP_AMOUNT - DAY_IN_LEDGERS;

pub const BALANCE_BUMP_AMOUNT: u32 = 30 * DAY_IN_LEDGERS;
pub const BALANCE_LIFETIME_THRESHOLD: u32 = BALANCE_BUMP_AMOUNT - DAY_IN_LEDGERS;

pub const METADATA_KEY: Symbol = symbol_short!("METADATA");

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    MarketExists = 21,
    CantDepositZero = 22,
    NoBalance = 23,
}

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
