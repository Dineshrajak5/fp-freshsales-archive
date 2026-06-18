#!/bin/bash
# Loads all cleaned CSVs into Supabase via psql \copy.
# Requires DB_URL environment variable to be set.

set -e

if [ -z "$DB_URL" ]; then
  echo "ERROR: DB_URL not set. Run: export DB_URL=\"postgresql://...\""
  exit 1
fi

CLEAN_DIR="data/clean"

# Order matters only for foreign keys — we don't have any enforced, so any order is fine.
# Listed roughly main tables first, join tables after, for readability.
TABLES=(
  users
  user_roles
  accounts
  contacts
  contact_emails
  contact_phones
  opportunities
  opportunity_contacts
  account_contacts
  leads
  lead_emails
  lead_phones
  notes
  note_targets
  tasks
  task_targets
  task_collaborators
  meetings
  meeting_targets
  meeting_attendees
  sales_activities
  salesactivity_targets
  salesactivity_collaborators
  call_logs
)

for table in "${TABLES[@]}"; do
  file="$CLEAN_DIR/${table}.csv"
  if [ ! -f "$file" ]; then
    echo "  SKIP  $table (file not found: $file)"
    continue
  fi
  echo -n "  loading $table ... "
  psql "$DB_URL" -c "TRUNCATE $table;" > /dev/null
  psql "$DB_URL" -c "\copy $table FROM '$file' WITH (FORMAT csv, HEADER true, NULL '');" 
done

echo ""
echo "Done. Row counts:"
for table in "${TABLES[@]}"; do
  count=$(psql "$DB_URL" -tAc "SELECT count(*) FROM $table;")
  printf "  %-32s %s\n" "$table" "$count"
done