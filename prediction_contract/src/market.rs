use crate::{token, DataKey, MarketId};
use soroban_sdk::{contract, contractimpl, contracttype, Address, Bytes, BytesN, Env};

fn read_market(e: &Env, market_id: &MarketId) -> Market {
    let key = DataKey::Market(market_id.clone());
    e.storage().instance().get(&key).unwrap()
}

fn write_market(e: &Env, market_id: &MarketId, market: Market) {
    let key = DataKey::Market(market_id.clone());
    e.storage().instance().set(&key, &market)
}

fn read_balance(e: &Env, key: &DataKey) -> i128 {
    e.storage().instance().get(key).unwrap()
}

fn write_balance(e: &Env, key: &DataKey, balance: i128) {
    e.storage().instance().set(key, &balance);
}

#[derive(Clone)]
#[contracttype]
struct Outcome {
    title: Bytes,
    contract: Address,
}

#[derive(Clone)]
#[contracttype]
pub struct Market {
    result: u32,
    asserted_outcome_id: BytesN<32>,
    outcome1: Outcome,
    outcome2: Outcome,
    desc: Bytes,
}

#[contract]
pub struct PredictionMarket;

#[contractimpl]
impl PredictionMarket {
    pub fn initialize(
        e: Env,
        o1_wasm_hash: BytesN<32>,
        o2_wasm_hash: BytesN<32>,
        outcome1: Bytes,
        outcome2: Bytes,
        desc: Bytes,
    ) -> MarketId {
        // Input validation.
        assert!(!outcome1.is_empty(), "Empty first outcome");
        assert!(!outcome2.is_empty(), "Empty second outcome");
        assert!(!desc.is_empty(), "Empty description");
        assert_ne!(outcome1, outcome2, "Outcomes are the same");

        let block_number = e.ledger().sequence();
        let market_id = crate::gen_market_id(block_number, &desc);

        // Check if market already exists.
        if e.storage().instance().has(&market_id) {
            panic!("Market already exists");
        }

        // Store market data
        let market = Market {
            result: 0,
            asserted_outcome_id: BytesN::from_array(&e, &[0; 32]),
            outcome1: Outcome {
                contract: token::create_contract(&e, &o1_wasm_hash, &market_id, &outcome1),
                title: outcome1,
            },
            outcome2: Outcome {
                contract: token::create_contract(&e, &o2_wasm_hash, &market_id, &outcome2),
                title: outcome2,
            },
            desc,
        };

        write_market(&e, &market_id, market);

        market_id
    }

    /// Function to assert the market outcome.
    pub fn assert_market(e: Env, market_id: MarketId, asserted_outcome: Bytes) {
        let mut market = read_market(&e, &market_id);

        // Check if assertion is already active or market is resolved.
        assert!(market.result == 0, "Assertion active or resolved");

        // Validate asserted outcome.
        if asserted_outcome == market.outcome1.title {
            market.result = 1;
        } else if asserted_outcome == market.outcome2.title {
            market.result = 2;
        } else {
            panic!("Invalid asserted outcome");
        }

        // Set market as asserted.
        write_market(&e, &market_id, market);
    }

    pub fn deposit(e: Env, market_id: MarketId, id: Address, outcome: Bytes, amount: i128) {
        if amount <= 0 {
            panic!("Can't deposit less than 1 tokens");
        }

        let market = read_market(&e, &market_id);
        let (to, balance_key) = if outcome == market.outcome1.title {
            (&market.outcome1.contract, DataKey::BalanceO1(id.clone()))
        } else if outcome == market.outcome2.title {
            (&market.outcome2.contract, DataKey::BalanceO2(id.clone()))
        } else {
            panic!("Invalid outcome to deposit into")
        };

        let token_client = token::Client::new(&e, &id);
        token_client.transfer(to, &e.current_contract_address(), &amount);

        let new_balance = read_balance(&e, &balance_key) + amount;
        write_balance(&e, &balance_key, new_balance);
    }

    pub fn drain_winnings(e: Env, market_id: MarketId, id: Address) {
        let market = read_market(&e, &market_id);

        // Check if assertion is already active or market is resolved.
        assert!(market.result == 0, "Assertion active or resolved");

        let (from, balance_key) = match market.result {
            1 => (&market.outcome1.contract, DataKey::BalanceO1(id.clone())),
            2 => (&market.outcome2.contract, DataKey::BalanceO2(id.clone())),
            _ => panic!("Invalid outcome to deposit into"),
        };

        let balance = read_balance(&e, &balance_key);

        let token_client = token::Client::new(&e, &id);
        token_client.transfer(from, &id, &balance);

        write_balance(&e, &balance_key, 0);
    }
}
