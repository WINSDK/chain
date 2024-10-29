default: build

all: test

test: build
	cargo test

deploy: build
	stellar contract optimize --wasm ./target/wasm32-unknown-unknown/release/token_contract.wasm
	stellar contract deploy \
		--wasm ./target/wasm32-unknown-unknown/release/token_contract.wasm \
		--source me \
		--network testnet

build:
	soroban contract build
	@ls -l target/wasm32-unknown-unknown/release/*.wasm
fmt:
	cargo fmt --all

clean:
	cargo clean
