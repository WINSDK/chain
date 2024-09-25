#![no_std]

use soroban_sdk::{contracttype, symbol_short, Address, Bytes, Symbol};

mod token;
mod market;
mod test;

pub const METADATA_KEY: Symbol = symbol_short!("METADATA");

pub type Block = u32;
pub type Description = Bytes;

#[contracttype]
pub enum DataKey {
    Market(Block, Description),
    Admin,
    Balance(Address),
    Metadata(Symbol),
    Currency,
}
