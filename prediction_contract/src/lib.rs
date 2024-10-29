#![no_std]

use soroban_sdk::{contracterror, contracttype, symbol_short, xdr::ToXdr, Address, Bytes, Env, String, Symbol};

pub mod market;
mod test;
pub mod token;

pub const METADATA_KEY: Symbol = symbol_short!("METADATA");
pub type MarketId = Bytes;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    EmptyOutcome = 1,
    EmptyDescription = 2,
    OutcomesMatch = 3,
    MarketExists = 4,
    InvalidAssertedOutcome = 5,
    AssertionActiveOrResolved = 6,
    CantDepositLessThan1Token = 7,
    InvalidOutcomeToDepositInto = 8,
}

#[contracttype]
pub enum DataKey {
    Market,
    Balance(Address),
}

pub fn gen_market_id(e: &Env, block: u32, desc: &String) -> MarketId {
    let mut market_id = desc.clone().to_xdr(e);
    market_id.extend_from_array(&block.to_ne_bytes());
    market_id
}
