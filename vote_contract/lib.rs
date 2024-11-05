#![no_std]
use soroban_sdk::{Address, contract, contracttype, contractimpl, Env, log, Symbol, symbol_short, token};

#[contracttype]
#[derive(Clone)]
// struct for this prediction contract's metadata, uses const POLL
pub struct Poll {
    pub is_init: u64,
    pub winner: Symbol,
    pub start_time: u64,
    pub end_time: u64,
    pub opt1: u64,
    pub opt2: u64,
    pub total: u64,
}

const POLL: Symbol = symbol_short!("POLL");

#[contracttype]
// struct for mapping user Address to their votes for this Contract
// Admin will be populated with the admin Address on contract init()
pub enum Registry {
    Record(Address),
    Admin,
}

#[contracttype]
#[derive(Clone)]
// struct for vote option, amount voted
pub struct Record {
    pub selected: Symbol,
    pub votes: u64,
    pub time: u64,
}

const OPT1: Symbol = symbol_short!("OPT1");
const OPT2: Symbol = symbol_short!("OPT2");
const NONE: Symbol = symbol_short!("none");

#[contract]
pub struct VoteContract;

#[contractimpl]
impl VoteContract {

    // called after contract deployment by the admin to enable voting for this contract
    // should be called only once
    pub fn init(
        env: Env,
        admin: Address,
        duration: u64,
    ) {
        // check if init() has already been called for this contract
        let mut poll = Self::view_poll(env.clone());
        if poll.is_init == 1 {
            panic!("Already init");
        }
        else if poll.start_time != 0 {
            panic!("Already init");
        }
        else {
            // add admin address to registry
            admin.require_auth();
            env.storage().instance().set(&Registry::Admin, &admin);
            // add contract start and end time
            poll.start_time = env.ledger().timestamp();
            poll.end_time = env.ledger().timestamp() + duration;
            // finally assert that the contract has been init, set the rest of the values
            poll.is_init = 1;
            poll.winner = symbol_short!("none");
            poll.opt1 = 0;
            poll.opt2 = 0;
            poll.total = 0;
            env.storage().instance().set(&POLL, &poll);
            env.storage().instance().extend_ttl(100, 100);
        }
    }

    // function to stake votes for a prediction, in the dapp this must be called along
    // with the payment transaction for the correct amount
    // Note: each user can only stake votes once in this version of the contract
    pub fn record_votes(env: Env, user: Address, selected: Symbol, votes: u64) -> Symbol {
        // .clone() to be able to use the value again in this fn
        let mut records = Self::view_voter(env.clone(), user.clone());
        user.require_auth();
        let time = env.ledger().timestamp();
        // check for invalid values (no votes, time already stamped in record)
        if votes == 0 || records.time != 0 {
            panic!("Cannot vote");
        }
        else {
            let mut poll = Self::view_poll(env.clone());
            records.selected = selected;
            records.votes = votes;
            records.time = time;
            if records.selected == OPT1 {
                poll.opt1 = poll.opt1 + votes;
            }
            else if records.selected == OPT2 {
                poll.opt2 = poll.opt2 + votes;
            }
            poll.total = poll.total + votes;
            env.storage().instance().set(&Registry::Record(user), &records);
            env.storage().instance().set(&POLL, &poll);
            env.storage().instance().extend_ttl(100, 100);

            return symbol_short!("Recorded");
        }
    }

    // function to get Poll market values, also provides initial values for the struct
    pub fn view_poll(env: Env) -> Poll {
        env.storage().instance().get(&POLL).unwrap_or(Poll {
            is_init: 0,
            winner: symbol_short!("none"),
            start_time: 0,
            end_time: 0,
            opt1: 0,
            opt2: 0,
            total: 0,
        })
    }
    
    // function for a voter to view their vote and count, also provides initial values for the struct
    pub fn view_voter(env: Env, voter: Address) -> Record {
        let key = Registry::Record(voter.clone());
        env.storage().instance().get(&key).unwrap_or(Record {
            selected: symbol_short!("none"),
            votes: 0,
            time: 0,
        })
    }

    // function for admins to close the market, specifying a winner
    // input should either be Symbol "OPT1" or Symbol "OPT2", else remains as "none"
    pub fn close(env: Env, admin: Address, winner: Symbol) -> Poll {
        admin.require_auth();
        let mut poll = Self::view_poll(env.clone());
        let key = env.storage().instance().get(&Registry::Admin).unwrap_or(0);
        if key == 0 {
            panic!("Invalid admin");
        }
        else {
            if poll.winner != NONE {
                panic!("Poll already closed");
            }

            if winner.clone() == OPT1 {
                log!(&env, "Winner OPT1: {}", poll.opt1);
            }
            else if winner.clone() == OPT2 {
                log!(&env, "Winner OPT2: {}", poll.opt2);
            }
            else {
                panic!("Invalid winner");
            }

            poll.is_init = 0;
            poll.winner = winner;
            env.storage().instance().set(&POLL, &poll);
            env.storage().instance().extend_ttl(100, 100);
            return poll;
        }
    }

    // function for stakers to claim the earnings based on vote once market is closed
    // returns the amount given to the user
    // contract: the prediction contract Address, used for sending XLM to stakers
    pub fn claim(env: Env, user: Address, xlm: Address, contract: Address) {
        // verify caller with stored Record
        let key = Registry::Record(user.clone());
        user.require_auth();

        let poll = Self::view_poll(env.clone());
        let user_record = env.storage().instance().get(&key).unwrap_or(0);
        
        // if user has a record and market is open, not valid
        if user_record == 0 {
            panic!("No user record");
        }
        else if poll.is_init == 0 {
            panic!("Market not closed");
        }
        else if poll.winner == NONE {
            panic!("Market not closed");
        }
        else {
            // TokenClient with the XLM Contract address
            let client = token::TokenClient::new(&env, &xlm);
            let records = Self::view_voter(env.clone(), user.clone());
            
            // allocate XLM payments from current pool, based on user's vote 
            // proportion of total, since each vote means a certain amount bet
            // formula = voter's full vote amount + proportion of votes from the losing pool
            let opt1_votes: f64 = poll.opt1 as f64;
            let opt2_votes: f64 = poll.opt2 as f64;
            let user_votes: f64 = records.votes as f64;

            if poll.winner == records.selected {
                if records.selected == OPT1 {
                    let ratio = user_votes / opt1_votes;
                    let mut payout: f64 = ratio * opt2_votes;
                    payout += user_votes;
                    let final_pay: i128 = payout as i128;
                    client.transfer(&contract, &user, &final_pay);
                }
                else {
                    let ratio = user_votes / opt2_votes;
                    let mut payout: f64 = ratio * opt1_votes;
                    payout += user_votes;
                    let final_pay: i128 = payout as i128;
                    client.transfer(&contract, &user, &final_pay);
                }
                
            }
            else {
                panic!("No valid claimings");
            }
        }
    }
}