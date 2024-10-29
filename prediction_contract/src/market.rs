use crate::{token, DataKey, Error, MarketId};
use soroban_sdk::{assert_with_error, contract, contractimpl, contracttype, panic_with_error, Address, BytesN, Env, String};

fn read_market(e: &Env) -> Market {
    e.storage().instance().get(&DataKey::Market).unwrap()
}

fn write_market(e: &Env, market: Market) {
    e.storage().instance().set(&DataKey::Market, &market)
}

fn read_balance(e: &Env, id: &Address) -> i128 {
    e.storage().instance().get(id).unwrap()
}

fn write_balance(e: &Env, id: &Address, balance: i128) {
    e.storage().instance().set(id, &balance);
}

#[derive(Clone)]
#[contracttype]
struct Outcome {
    title: String,
    contract: Address,
}

#[derive(Clone)]
#[contracttype]
pub struct Market {
    result: u32,
    asserted_outcome_id: BytesN<32>,
    outcome1: Outcome,
    outcome2: Outcome,
    desc: String,
}

#[contract]
pub struct PredictionMarket;

#[contractimpl]
impl PredictionMarket {
    pub fn initialize(
        e: Env,
        token_wasm_hash: BytesN<32>,
        outcome1: String,
        outcome2: String,
        desc: String,
    ) -> MarketId {
        // Input validation.
        assert_with_error!(e, !outcome1.is_empty(), Error::EmptyOutcome);
        assert_with_error!(e, !outcome2.is_empty(), Error::EmptyOutcome);
        assert_with_error!(e, !desc.is_empty(), Error::EmptyDescription);
        assert_with_error!(e, outcome1 != outcome2, Error::OutcomesMatch);

        let block_number = e.ledger().sequence();
        let market_id = crate::gen_market_id(&e, block_number, &desc);

        // Check if market already exists.
        if e.storage().instance().has(&market_id) {
            panic_with_error!(&e, Error::MarketExists);
        }

        // Store market data
        let market = Market {
            result: 0,
            asserted_outcome_id: BytesN::from_array(&e, &[0; 32]),
            outcome1: Outcome {
                contract: token::create_contract(&e, &token_wasm_hash, &market_id, &outcome1),
                title: outcome1,
            },
            outcome2: Outcome {
                contract: token::create_contract(&e, &token_wasm_hash, &market_id, &outcome2),
                title: outcome2,
            },
            desc,
        };

        write_market(&e, market);

        market_id
    }

    /// Function to assert the market outcome.
    pub fn assert_market(e: Env, asserted_outcome: String) {
        let mut market = read_market(&e);

        // Check if assertion is already active or market is resolved.
        assert_with_error!(e, market.result == 0, Error::AssertionActiveOrResolved);

        // Validate asserted outcome.
        if asserted_outcome == market.outcome1.title {
            market.result = 1;
        } else if asserted_outcome == market.outcome2.title {
            market.result = 2;
        } else {
            panic_with_error!(e, Error::InvalidAssertedOutcome);
        }

        // Set market as asserted.
        write_market(&e, market);
    }

    pub fn deposit(e: Env, id: Address, outcome: String, amount: i128) {
        if amount <= 0 {
            panic_with_error!(e, Error::CantDepositLessThan1Token);
        }

        let market = read_market(&e);
        let balance_key = if outcome == market.outcome1.title {
            &market.outcome1.contract
        } else if outcome == market.outcome2.title {
            &market.outcome2.contract
        } else {
            panic_with_error!(e, Error::InvalidOutcomeToDepositInto);
        };

        let token_client = token::Client::new(&e, &id);
        token_client.transfer(&id, &e.current_contract_address(), &amount);

        let new_balance = read_balance(&e, &balance_key) + amount;
        write_balance(&e, &id, new_balance);
    }

    pub fn drain_winnings(e: Env, id: Address) {
        let market = read_market(&e);

        // Check if assertion is already active or market is resolved.
        assert_with_error!(e, market.result == 0, Error::AssertionActiveOrResolved);

        let from = match market.result {
            1 => &market.outcome1.contract,
            2 => &market.outcome2.contract,
            _ => panic_with_error!(e, Error::InvalidOutcomeToDepositInto),
        };

        let balance = read_balance(&e, &id);

        let token_client = token::Client::new(&e, &id);
        token_client.transfer(from, &id, &balance);

        write_balance(&e, &id, 0);
    }
}
