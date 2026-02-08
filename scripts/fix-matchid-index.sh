#!/bin/bash

###############################################################################
# Fix matchId Index - Drop Global Unique Index
#
# This script drops the old global unique index on matchId and ensures
# the correct compound index (organizationId + matchId) exists.
#
# The old index prevented different organizations from using the same matchId.
# The new compound index allows each organization to have its own matchId sequence.
#
# Usage:
#   ./scripts/fix-matchid-index.sh
#
# For production:
#   MONGODB_URI="mongodb://production-uri" ./scripts/fix-matchid-index.sh
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Fix matchId Index Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Get MongoDB URI from environment or use default
MONGODB_URI="${MONGODB_URI:-mongodb://localhost:27017/cricket-feedback}"

echo -e "${YELLOW}MongoDB URI:${NC} ${MONGODB_URI}"
echo ""

# Confirm before proceeding in production
if [[ "$MONGODB_URI" != *"localhost"* ]]; then
  echo -e "${RED}⚠️  WARNING: This will modify PRODUCTION database!${NC}"
  read -p "Are you sure you want to continue? (yes/no): " confirm
  if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 1
  fi
fi

echo -e "${YELLOW}Step 1:${NC} Checking current indexes..."
echo ""

# Check if old index exists
OLD_INDEX_EXISTS=$(mongosh "$MONGODB_URI" --quiet --eval "
  const indexes = db.matches.getIndexes();
  const oldIndex = indexes.find(idx => idx.name === 'matchId_1');
  print(oldIndex ? 'true' : 'false');
")

if [ "$OLD_INDEX_EXISTS" = "true" ]; then
  echo -e "${YELLOW}Found old global unique index 'matchId_1'${NC}"
  echo -e "${YELLOW}Step 2:${NC} Dropping old index..."
  
  mongosh "$MONGODB_URI" --quiet --eval "
    const result = db.matches.dropIndex('matchId_1');
    print('✓ Dropped index: matchId_1');
    print('  nIndexesWas: ' + result.nIndexesWas);
  "
  
  echo -e "${GREEN}✓ Old index dropped successfully${NC}"
else
  echo -e "${GREEN}✓ Old index 'matchId_1' does not exist (already dropped or never existed)${NC}"
fi

echo ""
echo -e "${YELLOW}Step 3:${NC} Verifying compound index exists..."
echo ""

# Check if compound index exists
COMPOUND_INDEX_EXISTS=$(mongosh "$MONGODB_URI" --quiet --eval "
  const indexes = db.matches.getIndexes();
  const compoundIndex = indexes.find(idx => idx.name === 'organizationId_1_matchId_1');
  print(compoundIndex ? 'true' : 'false');
")

if [ "$COMPOUND_INDEX_EXISTS" = "true" ]; then
  echo -e "${GREEN}✓ Compound index 'organizationId_1_matchId_1' exists${NC}"
else
  echo -e "${RED}✗ Compound index 'organizationId_1_matchId_1' NOT found${NC}"
  echo -e "${YELLOW}Creating compound index...${NC}"
  
  mongosh "$MONGODB_URI" --quiet --eval "
    db.matches.createIndex(
      { organizationId: 1, matchId: 1 },
      { unique: true, sparse: true, name: 'organizationId_1_matchId_1' }
    );
    print('✓ Created compound index: organizationId_1_matchId_1');
  "
  
  echo -e "${GREEN}✓ Compound index created${NC}"
fi

echo ""
echo -e "${YELLOW}Step 4:${NC} Final index verification..."
echo ""

mongosh "$MONGODB_URI" --quiet --eval "
  const indexes = db.matches.getIndexes();
  print('Current indexes on matches collection:');
  print('');
  indexes.forEach(idx => {
    const keyStr = JSON.stringify(idx.key);
    const props = [];
    if (idx.unique) props.push('unique');
    if (idx.sparse) props.push('sparse');
    const propsStr = props.length > 0 ? ' [' + props.join(', ') + ']' : '';
    print('  • ' + idx.name + ': ' + keyStr + propsStr);
  });
"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✓ Script completed successfully${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Summary:${NC}"
echo "  - Old global unique index on matchId has been removed"
echo "  - Compound index (organizationId + matchId) is active"
echo "  - Each organization can now use the same matchId values"
echo ""
