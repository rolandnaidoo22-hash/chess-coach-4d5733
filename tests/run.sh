#!/bin/sh
# Run all tests:  sh tests/run.sh
set -e; cd "$(dirname "$0")/.."; for t in tests/*.test.js; do echo "== $t"; node "$t"; done
