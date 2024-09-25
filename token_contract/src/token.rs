use crate::DataKey;

use soroban_sdk::token::Interface;
use soroban_sdk::{contract, contractimpl, contracttype, Address, Bytes, Env, String};
use soroban_token_sdk::TokenUtils;

pub fn has_administrator(e: &Env) -> bool {
    let key = DataKey::Admin;
    e.storage().instance().has(&key)
}

pub fn read_administrator(e: &Env) -> Address {
    let key = DataKey::Admin;
    e.storage().instance().get(&key).unwrap()
}

pub fn write_administrator(e: &Env, id: &Address) {
    let key = DataKey::Admin;
    e.storage().instance().set(&key, id);
}

pub fn read_balance(e: &Env, addr: Address) -> i128 {
    let key = DataKey::Balance(addr);
    if let Some(balance) = e.storage().persistent().get(&key) {
        // e.storage()
        //     .persistent()
        //     .extend_ttl(&key, BALANCE_LIFETIME_THRESHOLD, BALANCE_BUMP_AMOUNT);
        balance
    } else {
        0
    }
}

pub fn write_balance(e: &Env, addr: Address, amount: i128) {
    let key = DataKey::Balance(addr);
    e.storage().persistent().set(&key, &amount);
    // e.storage()
    //     .persistent()
    //     .extend_ttl(&key, BALANCE_LIFETIME_THRESHOLD, BALANCE_BUMP_AMOUNT);
}

pub fn receive_balance(e: &Env, addr: Address, amount: i128) {
    let balance = read_balance(e, addr.clone());
    write_balance(e, addr, balance + amount);
}

pub fn spend_balance(e: &Env, addr: Address, amount: i128) {
    let balance = read_balance(e, addr.clone());
    if balance < amount {
        panic!("insufficient balance");
    }
    write_balance(e, addr, balance - amount);
}

pub fn write_metadata(e: &Env, metadata: Metadata) {
    e.storage()
        .persistent()
        .set(&crate::METADATA_KEY, &metadata);
}

pub fn check_nonnegative_amount(amount: i128) {
    if amount < 0 {
        panic!("negative amount is not allowed: {}", amount)
    }
}

#[derive(Clone)]
#[contracttype]
pub struct Metadata {
    outcome: Bytes,
    name: String,
}

#[contract]
pub struct Token;

#[contractimpl]
impl Token {
    pub fn initialize(e: Env, admin: Address, outcome: Bytes, name: String) {
        if has_administrator(&e) {
            panic!("already initialized")
        }
        write_administrator(&e, &admin);

        write_metadata(&e, Metadata { outcome, name })
    }

    pub fn mint(e: Env, to: Address, amount: i128) {
        check_nonnegative_amount(amount);
        let admin = read_administrator(&e);
        admin.require_auth();

        // e.storage()
        //     .instance()
        //     .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        receive_balance(&e, to.clone(), amount);
        TokenUtils::new(&e).events().mint(admin, to, amount);
    }

    pub fn set_admin(e: Env, new_admin: Address) {
        let admin = read_administrator(&e);
        admin.require_auth();

        // e.storage()
        //     .instance()
        //     .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        write_administrator(&e, &new_admin);
        TokenUtils::new(&e).events().set_admin(admin, new_admin);
    }
}

#[contractimpl]
impl Interface for Token {
    fn allowance(_e: Env, _from: Address, _spender: Address) -> i128 {
        // e.storage()
        //     .instance()
        //     .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        // read_allowance(&e, from, spender).amount
        0
    }

    fn approve(_e: Env, _from: Address, _spender: Address, _amount: i128, _expiration_ledger: u32) {
        // from.require_auth();

        // check_nonnegative_amount(amount);

        // e.storage()
        //     .instance()
        //     .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        // write_allowance(&e, from.clone(), spender.clone(), amount, expiration_ledger);
        // TokenUtils::new(&e)
        //     .events()
        //     .approve(from, spender, amount, expiration_ledger);
    }

    fn balance(e: Env, id: Address) -> i128 {
        // e.storage()
        //     .instance()
        //     .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        read_balance(&e, id)
    }

    fn transfer(e: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();

        check_nonnegative_amount(amount);

        // e.storage()
        //     .instance()
        //     .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        spend_balance(&e, from.clone(), amount);
        receive_balance(&e, to.clone(), amount);
        TokenUtils::new(&e).events().transfer(from, to, amount);
    }

    fn transfer_from(_e: Env, _spender: Address, _from: Address, _to: Address, _amount: i128) {
        // spender.require_auth();

        // check_nonnegative_amount(amount);

        // e.storage()
        //     .instance()
        //     .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        // spend_allowance(&e, from.clone(), spender, amount);
        // spend_balance(&e, from.clone(), amount);
        // receive_balance(&e, to.clone(), amount);
        // TokenUtils::new(&e).events().transfer(from, to, amount)
    }

    fn burn(e: Env, from: Address, amount: i128) {
        from.require_auth();

        check_nonnegative_amount(amount);

        // e.storage()
        //     .instance()
        //     .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        spend_balance(&e, from.clone(), amount);
        TokenUtils::new(&e).events().burn(from, amount);
    }

    fn burn_from(_e: Env, _spender: Address, _from: Address, _amount: i128) {
        // spender.require_auth();

        // check_nonnegative_amount(amount);

        // e.storage()
        //     .instance()
        //     .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        // spend_allowance(&e, from.clone(), spender, amount);
        // spend_balance(&e, from.clone(), amount);
        // TokenUtils::new(&e).events().burn(from, amount)
    }

    fn decimals(e: Env) -> u32 {
        let util = TokenUtils::new(&e);
        util.metadata().get_metadata().decimal
    }

    fn name(e: Env) -> String {
        let util = TokenUtils::new(&e);
        util.metadata().get_metadata().name
    }

    fn symbol(e: Env) -> String {
        let util = TokenUtils::new(&e);
        util.metadata().get_metadata().symbol
    }
}
