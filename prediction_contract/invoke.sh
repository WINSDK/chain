#!/bin/bash
set -e

stellar contract invoke \
    --id CCIPGKQL2XEXHXP2IXCCDHPM7ILQAZQURVE6DUJ4BIUWTENRKDDL3FRO \
    --source me \
    --network testnet \
    -- initialize \
    --token_wasm_hash '2594a0fbfe5faa53c9c43cce19c7071f05f633009aca4db54f3572868b9a1359' \
    --outcome1 'joe biden wins' \
    --outcome2 'trump wins' \
    --desc 'outcome of presidential election'
