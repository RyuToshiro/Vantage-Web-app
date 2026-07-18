#!/usr/bin/env bash
# Runs the REAL migration (supabase/migrations/0001_init.sql) against a
# throwaway local Postgres database, then exercises RLS and the credit RPCs
# as two simulated users. Requires a local Postgres superuser (adjust PSQL_
# below if yours isn't passwordless local "postgres").
#
# Usage: sudo bash supabase/testing/run.sh
set -euo pipefail
cd "$(dirname "$0")/../.."

DB=vantage_rls_test
RUN() { su postgres -c "psql -v ON_ERROR_STOP=1 -d $DB $*"; }

echo "==> (Re)creating $DB"
su postgres -c "psql -c \"DROP DATABASE IF EXISTS $DB;\""
su postgres -c "psql -c \"CREATE DATABASE $DB;\""

echo "==> Applying platform stub (fakes the slice of Supabase's auth/storage schema we depend on)"
RUN -f supabase/testing/00_stub_platform.sql > /dev/null

echo "==> Applying the REAL migration"
RUN -f supabase/migrations/0001_init.sql > /dev/null

echo "==> Running RLS + RPC behavioral tests"
RUN -f supabase/testing/01_rls_behavior.sql

echo "==> Negative test 1/2: user A inserting a tour owned by user B (must fail)"
if RUN -f supabase/testing/02_rls_negative_insert_expect_failure.sql > /dev/null 2>&1; then
  echo "FAIL: that insert should have been rejected by RLS but succeeded"; exit 1
else
  echo "PASS: RLS correctly rejected it"
fi

echo "==> Negative test 2/2: user B writing into user A's storage folder (must fail)"
if RUN -f supabase/testing/03_rls_negative_storage_expect_failure.sql > /dev/null 2>&1; then
  echo "FAIL: that insert should have been rejected by RLS but succeeded"; exit 1
else
  echo "PASS: RLS correctly rejected it"
fi

echo "==> Cleaning up"
su postgres -c "psql -c \"DROP DATABASE $DB;\""

echo "All RLS/RPC checks passed."
