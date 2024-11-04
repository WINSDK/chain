#!/bin/bash
set -e

curl -X POST localhost:1234/create_market \
    -H "Content-Type: application/json" \
    -d '{
      "title": "Exciting New Market",
      "imageUrl": "http://example.com/image.jpg",
      "description": "An exciting market to bet on!",
      "betOptions": ["a 1", "b 2"],
      "betPercentage": [60.0, 40.0]
    }' \
    --fail \
    --silent \
    --show-error

curl -X GET localhost:1234/market?id=1 \
    --fail \
    --silent \
    --show-error

curl -X GET localhost:1234/markets \
    --fail \
    --silent \
    --show-error
