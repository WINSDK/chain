default: build

all: test

test: build
	cargo test

deploy: build
	stellar contract optimize --wasm ./target/wasm32-unknown-unknown/release/prediction_contract.wasm
	stellar contract deploy \
		--wasm ./target/wasm32-unknown-unknown/release/prediction_contract.optimized.wasm \
		--source me \
		--network testnet

build:
	$(MAKE) -C ../token_contract || break;
	soroban contract build
	@ls -l target/wasm32-unknown-unknown/release/*.wasm
fmt:
	cargo fmt --all

clean:
	cargo clean
