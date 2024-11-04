use std::collections::HashMap;

use actix_web::web::{Data, Json, Query};
use actix_web::{get, post, App, HttpResponse, HttpServer, Responder};
use serde::{Deserialize, Serialize};
use sqlx::sqlite::SqlitePoolOptions;
use sqlx::SqlitePool;
use tokio::time::{self, Duration};

struct AppData {
    db: SqlitePool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Bet {
    text: String,
    stake: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Market {
    id: i64,
    title: String,
    image_url: String,
    description: String,
    bets: Vec<Bet>,
}

#[derive(Serialize, Deserialize)]
struct CreateMarket {
    title: String,
    image_url: String,
    description: String,
    bets: Vec<String>,
}

#[get("/markets")]
async fn get_markets(data: Data<AppData>) -> impl Responder {
    // Fetch all markets.
    let query = sqlx::query!("SELECT id, title, image_url, description FROM market");
    let Ok(markets) = query.fetch_all(&data.db).await else {
        return HttpResponse::InternalServerError().finish();
    };

    let market_ids: Vec<i64> = markets.iter().map(|row| row.id).collect();
    if market_ids.is_empty() {
        return HttpResponse::Ok().json(market_ids);
    }

    // Fetch all bet options for these markets.
    let query = sqlx::query!("SELECT market_id, text, stake FROM bet_options");
    let Ok(bet_options) = query.fetch_all(&data.db).await else {
        return HttpResponse::InternalServerError().finish();
    };

    // Organize bet options by market_id.
    let mut options_map: HashMap<i64, Vec<Bet>> = HashMap::new();

    for bet_option in bet_options {
        options_map
            .entry(bet_option.market_id)
            .or_default()
            .push(Bet {
                text: bet_option.text,
                stake: bet_option.stake as u64,
            });
    }

    // Build the final list of markets with their bet options.
    let mut market_rows = Vec::new();
    for market in markets {
        let bets = options_map
            .remove(&market.id)
            .expect("Impossible, market has id yet no bets");

        market_rows.push(Market {
            id: market.id,
            title: market.title,
            image_url: market.image_url,
            description: market.description,
            bets,
        });
    }

    HttpResponse::Ok().json(market_rows)
}

#[derive(Debug, Deserialize)]
struct MarketParams {
    id: i64,
}

#[get("/market")]
async fn get_market(data: Data<AppData>, Query(params): Query<MarketParams>) -> impl Responder {
    // Fetch all markets.
    let query = sqlx::query!(
        "SELECT title, image_url, description FROM market WHERE ID = ?",
        params.id
    );
    let Ok(market) = query.fetch_one(&data.db).await else {
        return HttpResponse::InternalServerError().finish();
    };

    // Fetch all bet options.
    let query = sqlx::query!(
        "SELECT text, stake FROM bet_options WHERE market_id = ?",
        params.id
    );
    let Ok(bet_options) = query.fetch_all(&data.db).await else {
        return HttpResponse::InternalServerError().finish();
    };

    HttpResponse::Ok().json(Market {
        id: params.id,
        title: market.title,
        image_url: market.image_url,
        description: market.description,
        bets: bet_options.iter().map(|b| Bet {
            text: b.text.to_string(),
            stake: b.stake as u64 })
            .collect(),
    })
}

#[post("/create_market")]
async fn create_market(data: Data<AppData>, Json(req): Json<CreateMarket>) -> impl Responder {
    // Start a database transaction.
    let Ok(mut tx) = data.db.begin().await else {
        return HttpResponse::InternalServerError().finish();
    };

    // Insert into the market table and retrieve the new market ID.
    let query = sqlx::query!(
        r#"
        INSERT INTO market (title, image_url, description)
        VALUES (?, ?, ?)
        RETURNING id
        "#,
        req.title,
        req.image_url,
        req.description,
    );
    let market_id = match query.fetch_one(&mut *tx).await {
        Ok(record) => record.id,
        Err(err) => {
            eprintln!("[create_market] {err:?}");
            let _ = tx.rollback().await;
            return HttpResponse::InternalServerError().finish();
        }
    };

    // Insert each bet option into the bet_options table.
    for text in req.bets {
        let query = sqlx::query!(
            r#"
            INSERT INTO bet_options (market_id, text)
            VALUES (?, ?)
            "#,
            market_id,
            text,
        );
        if let Err(err) = query.execute(&mut *tx).await {
            eprintln!("[create_market] {err:?}");
            let _ = tx.rollback().await;
            return HttpResponse::InternalServerError().finish();
        }
    }

    if let Err(_) = tx.commit().await {
        return HttpResponse::InternalServerError().finish();
    }

    HttpResponse::Created().finish()
}

#[derive(Debug, Deserialize)]
struct StakeParams {
    id: i64,
    option: String,
    amount: i64,
}

#[get("/stake")]
async fn stake_bet(data: Data<AppData>, Query(params): Query<StakeParams>) -> impl Responder {
    if params.amount < 0 {
        return HttpResponse::InternalServerError().finish();
    }

    // Fetch all bet options.
    let query = sqlx::query!(
        "UPDATE bet_options SET stake = stake + ? WHERE market_id = ? AND text = ?",
        params.amount,
        params.id,
        params.option,
    );

    if let Err(err) = query.execute(&data.db).await {
        eprintln!("[stake_bet] {err:?}");
        return HttpResponse::InternalServerError().finish();
    }

    HttpResponse::Created().finish()
}

#[tokio::main]
async fn main() -> std::io::Result<()> {
    // Initialize the database connection pool
    let pool = SqlitePoolOptions::new()
        .connect("sqlite:markets.db")
        .await
        .expect("Failed to connect to the database");

    let app_data = Data::new(AppData { db: pool });

    tokio::spawn(async move {
        // let client = reqwest::Client::new();
        let mut interval = time::interval(Duration::from_secs(1));

        loop {
            interval.tick().await;

            // let markets = include_str!("../markets.json");
            // let markets: Vec<Market> = serde_json::from_str(markets).unwrap();

            // let mut cur_markets = markets_data_cln.lock().unwrap();
            // *cur_markets = markets;

            // match client.get("https://events.com/markets").send().await {
            //     Ok(response) => match response.json::<Vec<Market>>().await {
            //         Ok(fetched_markets) => {
            //             let mut data = MARKETS_DATA.lock().unwrap();
            //             *data = fetched_markets;
            //             println!("Markets data updated.");
            //         }
            //         Err(e) => {
            //             eprintln!("Failed to parse markets data: {}", e);
            //         }
            //     },
            //     Err(e) => {
            //         eprintln!("Failed to fetch markets data: {}", e);
            //     }
            // }
        }
    });

    println!("Listening on 0.0.0.0:1234.");

    HttpServer::new(move || {
        App::new()
            .app_data(Data::clone(&app_data))
            .service(get_markets)
            .service(get_market)
            .service(create_market)
    })
    .bind("0.0.0.0:1234")?
    .run()
    .await
}
