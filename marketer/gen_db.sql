-- market table
CREATE TABLE market (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    description TEXT NOT NULL
);

-- bet_options table
CREATE TABLE bet_options (
    id INTEGER PRIMARY KEY,
    market_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    stake INTEGER DEFAULT 0 NOT NULL,
    FOREIGN KEY (market_id) REFERENCES market(id)
);
