#!/bin/bash

# Fix malformed quotes in TypeScript files
cd "./packages/core"

# Fix common patterns
find src/types -name "*.ts" -type f -exec sed -i '' \
  -e 's/UPDATE'\''/"UPDATE"/g' \
  -e 's/DELETE'\''/"DELETE"/g' \
  -e 's/pending'\''/"pending"/g' \
  -e 's/in-progress'\''/"in-progress"/g' \
  -e 's/completed'\''/"completed"/g' \
  -e 's/failed'\''/"failed"/g' \
  -e 's/cancelled'\''/"cancelled"/g' \
  -e 's/running'\''/"running"/g' \
  -e 's/info'\''/"info"/g' \
  -e 's/warning'\''/"warning"/g' \
  -e 's/error'\''/"error"/g' \
  -e 's/fixed'\''/"fixed"/g' \
  -e 's/exponential'\''/"exponential"/g' \
  -e 's/success'\''/"success"/g' \
  -e 's/failure'\''/"failure"/g' \
  -e 's/timeout'\''/"timeout"/g' \
  -e 's/retry'\''/"retry"/g' \
  -e 's/fifo'\''/"fifo"/g' \
  -e 's/lifo'\''/"lifo"/g' \
  -e 's/priority'\''/"priority"/g' \
  {} \;

echo "Fixed common quote patterns in TypeScript files"
