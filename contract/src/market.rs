use crate::token::{Token, TokenClient};
use crate::DataKey;

use soroban_sdk::{
    contract, contractimpl, contracttype, token, vec, Address, Bytes, BytesN, Env, IntoVal, Symbol,
};

fn read_currency(e: &Env) -> Address {
    let key = DataKey::Admin;
    e.storage().instance().get(&key).unwrap()
}

fn write_currency(e: &Env, currency: Address) {
    let key = DataKey::Currency;
    e.storage().instance().set(&key, &currency)
}

fn create_token<'a>(e: &Env, admin: &Address, outcome: &Bytes, name: &str) -> TokenClient<'a> {
    let token = TokenClient::new(e, e.register_contract(None, Token {}));
    token.initialize(admin, outcome, &name.into_val(e));
    token
}

#[derive(Clone)]
#[contracttype]
pub struct Market {
    resolved: bool,
    asserted_outcome_id: BytesN<32>,
    reward: i128,
    required_bond: i128,
    outcome1: Bytes,
    outcome2: Bytes,
    desc: Bytes,
}

#[derive(Clone)]
#[contracttype]
pub struct AssertedMarket {
    asserter: Address,
    market_id: BytesN<32>,
}

#[contract]
pub struct PredictionMarket;

#[contractimpl]
impl PredictionMarket {
    pub fn init(e: Env, currency: Address) {
        write_currency(&e, currency);
    }

    pub fn init_market(
        e: Env,
        outcome1: Bytes,
        outcome2: Bytes,
        desc: Bytes,
        reward: i128,
        required_bond: i128,
    ) {
        // Input validation.
        assert!(!outcome1.is_empty(), "Empty first outcome");
        assert!(!outcome2.is_empty(), "Empty second outcome");
        assert!(!desc.is_empty(), "Empty description");
        assert_ne!(outcome1, outcome2, "Outcomes are the same");

        let block_number = e.ledger().sequence();
        let market_key = DataKey::Market(block_number, desc.clone());

        // Check if market already exists.
        if e.storage().instance().has(&market_key) {
            panic!("Market already exists");
        }

        // Create outcome tokens.
        let admin = Address::generate();
        let outcome1_token = create_token(&e, &admin, &outcome1, "O1T");
        let outcome2_token = create_token(&e, &admin, &outcome2, "O2T");

        // Store market data
        let market = Market {
            resolved: false,
            asserted_outcome_id: BytesN::from_array(&e, &[0; 32]),
            reward,
            required_bond,
            outcome1,
            outcome2,
            desc,
        };

        e.storage().instance().set(&market_key, &market);

        // Transfer reward to contract if applicable
        if reward > 0 {
            let currency = read_currency(&e);
            let caller = e.invoker();
            token::Client::new(&e, &currency).transfer(&caller, &e.current_contract_address(), &reward);
        }
    }

    /// Function to assert the market outcome (simplified).
    pub fn assert_market(
        e: Env,
        market_key: BytesN<32>,
        asserted_outcome: Bytes,
    ) {
        let mut market: Market = e.storage().instance().get(&market_key).expect("Market does not exist");

        // Check if assertion is already active or market is resolved
        assert!(
            market.asserted_outcome_id == BytesN::from_array(&e, &[0; 32]),
            "Assertion active or resolved"
        );

        // Validate asserted outcome
        let asserted_outcome_id = e.crypto().sha256(&asserted_outcome);
        let valid_outcomes = vec![
            &e,
            market.outcome1.clone(),
            market.outcome2.clone(),
            Bytes::from_slice(&e, b"Unresolvable")
        ];
        assert!(
            valid_outcomes.iter().any(|o| e.crypto().sha256(&o) == asserted_outcome_id),
            "Invalid asserted outcome"
        );

        // Simulate bond transfer
        let minimum_bond = 1; // For simplicity
        let bond = if market.required_bond > minimum_bond {
            market.required_bond
        } else {
            minimum_bond
        };
        let currency = read_currency(&e);
        let caller = e.invoker();
        token::Client::new(&e, &currency).transfer(&caller, &e.current_contract_address(), &bond);

        // Update market state
        market.asserted_outcome_id = asserted_outcome_id;
        e.storage().instance().set(&market_key, &market);

        // For simplicity, we'll auto-resolve the assertion as true
        Self::assertion_resolved_callback(e.clone(), market_id, true);
    }

    /// Callback for assertion resolution.
    pub fn assertion_resolved_callback(e: Env, market_id: BytesN<32>, asserted_truthfully: bool) {
        let market_key = market_id.clone();
        let mut market: Market = e.storage().instance().get(&market_key).expect("Market does not exist");

        if asserted_truthfully {
            market.resolved = true;

            // Transfer reward to asserter
            if market.reward > 0 {
                let currency = read_currency(&e);
                let caller = e.invoker();
                token::Client::new(&e, &currency).transfer(&e.current_contract_address(), &caller, &market.reward);
            }
        } else {
            // Reset assertion
            market.asserted_outcome_id = BytesN::from_array(&e, &[0; 32]);
        }

        e.storage().instance().set(&market_key, &market);
    }

    pub fn create_outcome_tokens(e: Env, market_id: BytesN<32>, tokens_to_create: i128) {
        let market_key = market_id.clone();
        let market: Market = e.storage().instance().get(&market_key).expect("Market does not exist");

        let currency = read_currency(&e);
        let caller = e.invoker();

        // Transfer currency from caller to contract
        token::Client::new(&e, &currency).transfer(&caller, &e.current_contract_address(), &tokens_to_create);

        // Mint outcome tokens to caller
        TokenAdmin::mint(&e, &market.outcome1_token, &caller, &tokens_to_create);
        TokenAdmin::mint(&e, &market.outcome2_token, &caller, &tokens_to_create);
    }

    pub fn redeem_outcome_tokens(e: Env, market_id: BytesN<32>, tokens_to_redeem: i128) {
        let market_key = market_id.clone();
        let market: Market = e.storage().instance().get(&market_key).expect("Market does not exist");

        let currency = read_currency(&e);
        let caller = e.invoker();

        // Burn outcome tokens from caller
        TokenAdmin::burn(&e, &market.outcome1_token, &caller, &tokens_to_redeem);
        TokenAdmin::burn(&e, &market.outcome2_token, &caller, &tokens_to_redeem);

        // Transfer currency back to caller
        token::Client::new(&e, &currency).transfer(&e.current_contract_address(), &caller, &tokens_to_redeem);
    }

    /// Settle outcome tokens after market resolution.
    pub fn settle_outcome_tokens(e: Env, market_id: BytesN<32>) {
        let market_key = market_id.clone();
        let market: Market = e.storage().instance().get(&market_key).expect("Market does not exist");

        assert!(market.resolved, "Market not resolved");

        let caller = e.invoker();
        let outcome1_balance = TokenAdmin::balance(&e, &market.outcome1_token, &caller);
        let outcome2_balance = TokenAdmin::balance(&e, &market.outcome2_token, &caller);

        let mut payout = 0i128;
        if market.asserted_outcome_id == e.crypto().sha256(&market.outcome1) {
            payout = outcome1_balance;
        } else if market.asserted_outcome_id == e.crypto().sha256(&market.outcome2) {
            payout = outcome2_balance;
        } else {
            payout = (outcome1_balance + outcome2_balance) / 2;
        }

        // Burn outcome tokens from caller
        TokenAdmin::burn(&e, &market.outcome1_token, &caller, &outcome1_balance);
        TokenAdmin::burn(&e, &market.outcome2_token, &caller, &outcome2_balance);

        // Transfer payout to caller
        let currency = read_currency(&e);
        token::Client::new(&e, &currency).transfer(&e.current_contract_address(), &caller, &payout);
    }
}
