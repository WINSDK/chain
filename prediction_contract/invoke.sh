#!/bin/bash
set -ex

stellar contract invoke \
  --id $1 \
  --source me \
  --network testnet \
  -- $2 \  
  --to RPC
