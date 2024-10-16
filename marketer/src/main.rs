use actix_web::{get, App, HttpResponse, HttpServer, Responder};
use actix_web::web::Data;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tokio::time::{self, Duration};

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Market {
    title: String,
    #[serde(rename = "imageUrl")]
    image_url: String,
    description: String,
    #[serde(rename = "betOptions")]
    bet_options: Vec<String>,
    #[serde(rename = "betPercentage")]
    bet_percentage: Vec<f64>,
}

type MarketsData = Data<Mutex<Vec<Market>>>;

#[get("/markets")]
async fn get_markets(data: MarketsData) -> impl Responder {
    let markets = data.lock().unwrap();
    HttpResponse::Ok().json(markets.clone())
}

#[tokio::main]
async fn main() -> std::io::Result<()> {
    let markets_data = MarketsData::default();
    let markets_data_cln = Data::clone(&markets_data);

    tokio::spawn(async move {
        // let client = reqwest::Client::new();
        let mut interval = time::interval(Duration::from_secs(1));

        loop {
            interval.tick().await;

            let markets = include_str!("../markets.json");
            let markets: Vec<Market> = serde_json::from_str(markets).unwrap();

            let mut cur_markets = markets_data_cln.lock().unwrap();
            *cur_markets = markets;

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
            .app_data(Data::clone(&markets_data))
            .service(get_markets)
    })
    .bind("0.0.0.0:1234")?
    .run()
    .await
}
