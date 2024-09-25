#![no_std]

use soroban_sdk::{contracttype, symbol_short, Address, Bytes, Symbol};

pub mod market;
mod test;
pub mod token;

pub const METADATA_KEY: Symbol = symbol_short!("METADATA");
pub type MarketId = Bytes;

pub fn gen_market_id(block: u32, desc: &Bytes) -> MarketId {
    let mut market_id = desc.clone();
    market_id.extend_from_array(&block.to_ne_bytes());
    market_id
}

#[contracttype]
pub enum DataKey {
    Market(MarketId),
    BalanceO1(Address),
    BalanceO2(Address),
}
