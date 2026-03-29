#!/bin/bash
# Extract all blog posts with full rich content from Wix API
# Usage: ./scripts/extract-blog-full.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
source "$PROJECT_DIR/.env.local"

OUTPUT_DIR="$PROJECT_DIR/data/blog"
POSTS_DIR="$OUTPUT_DIR/posts"
mkdir -p "$POSTS_DIR"

echo "Extracting blog posts with full content..."

# Read post IDs from already extracted data
POST_IDS=$(python3 -c "
import json
d = json.load(open('$OUTPUT_DIR/all_posts.json'))
for p in d['posts']:
    print(p['id'] + '|' + p.get('slug',''))
")

TOTAL=$(echo "$POST_IDS" | wc -l | tr -d ' ')
COUNT=0

while IFS='|' read -r POST_ID SLUG; do
  COUNT=$((COUNT + 1))
  echo "  [$COUNT/$TOTAL] Fetching: $SLUG"

  curl -s \
    -H "Authorization: $WIX_API_KEY" \
    -H "wix-site-id: $WIX_SITE_ID" \
    "https://www.wixapis.com/v3/posts/${POST_ID}?fieldsets=RICH_CONTENT" \
    -X GET \
    -o "$POSTS_DIR/${SLUG}.json"

  # Small delay to avoid rate limiting
  sleep 0.3
done <<< "$POST_IDS"

echo ""
echo "All $TOTAL posts exported to data/blog/posts/"
echo "Done!"
