#!/bin/bash
# Extract all blog posts from Wix API
# Usage: ./scripts/extract-blog.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
source "$PROJECT_DIR/.env.local"

OUTPUT_DIR="$PROJECT_DIR/data/blog"
mkdir -p "$OUTPUT_DIR"

echo "Extracting blog posts from Wix..."

OFFSET=0
LIMIT=50
TOTAL=0
PAGE=1

while true; do
  echo "  Fetching page $PAGE (offset $OFFSET)..."

  RESPONSE=$(curl -s \
    -H "Authorization: $WIX_API_KEY" \
    -H "wix-site-id: $WIX_SITE_ID" \
    "https://www.wixapis.com/v3/posts/query" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "{\"paging\":{\"limit\":$LIMIT,\"offset\":$OFFSET}}")

  # Save raw response
  echo "$RESPONSE" | python3 -m json.tool > "$OUTPUT_DIR/page_${PAGE}.json" 2>/dev/null || echo "$RESPONSE" > "$OUTPUT_DIR/page_${PAGE}.json"

  # Get count and total
  COUNT=$(echo "$RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('metaData',{}).get('count',0))" 2>/dev/null || echo "0")

  if [ "$TOTAL" -eq 0 ]; then
    TOTAL=$(echo "$RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('metaData',{}).get('total',0))" 2>/dev/null || echo "0")
    echo "  Total posts: $TOTAL"
  fi

  HAS_NEXT=$(echo "$RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('pagingMetadata',{}).get('hasNext', False))" 2>/dev/null || echo "False")

  if [ "$HAS_NEXT" != "True" ]; then
    break
  fi

  OFFSET=$((OFFSET + LIMIT))
  PAGE=$((PAGE + 1))
done

# Merge all pages into a single file
python3 -c "
import json, glob, os

all_posts = []
for f in sorted(glob.glob('$OUTPUT_DIR/page_*.json')):
    with open(f) as fh:
        data = json.load(fh)
        all_posts.extend(data.get('posts', []))

output = {'total': len(all_posts), 'posts': all_posts}
with open('$OUTPUT_DIR/all_posts.json', 'w', encoding='utf-8') as out:
    json.dump(output, out, ensure_ascii=False, indent=2)

print(f'  Exported {len(all_posts)} posts to data/blog/all_posts.json')

# Also create a summary CSV
with open('$OUTPUT_DIR/posts_summary.csv', 'w', encoding='utf-8') as csv:
    csv.write('id,title,slug,published_date,language,minutes_to_read\n')
    for p in all_posts:
        title = p.get('title','').replace('\"','\"\"')
        csv.write(f'\"{p[\"id\"]}\",\"{title}\",\"{p.get(\"slug\",\"\")}\",\"{p.get(\"firstPublishedDate\",\"\")}\",\"{p.get(\"language\",\"\")}\",{p.get(\"minutesToRead\",0)}\n')

print(f'  Summary CSV created: data/blog/posts_summary.csv')
"

echo "Done!"
