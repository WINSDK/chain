default: build

all: test

test: build
	cargo test

build:
	@rm markets.db
	sqlite3 markets.db < gen_db.sql
	cargo build
fmt:
	cargo fmt --all

clean:
	@rm markets.db
	cargo clean
