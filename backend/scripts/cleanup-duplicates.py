#!/usr/bin/env python3
"""Remove duplicate pages and their orphaned components from DynamoDB."""

import json
import subprocess
import sys

TABLE = "swami-rupeshwaranand-api-prod-main"
PROFILE = "SwamiJi"
REGION = "ap-south-1"

def aws_cmd(args):
    cmd = ["aws"] + args + ["--profile", PROFILE, "--region", REGION, "--output", "json"]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"ERROR: {result.stderr}", file=sys.stderr)
        sys.exit(1)
    return json.loads(result.stdout)

def scan_all(filter_expr, attr_values, projection, attr_names=None):
    """Scan with pagination support."""
    items = []
    args = [
        "dynamodb", "scan",
        "--table-name", TABLE,
        "--filter-expression", filter_expr,
        "--expression-attribute-values", json.dumps(attr_values),
        "--projection-expression", projection,
    ]
    if attr_names:
        args += ["--expression-attribute-names", json.dumps(attr_names)]
    
    last_key = None
    while True:
        scan_args = list(args)
        if last_key:
            scan_args += ["--exclusive-start-key", json.dumps(last_key)]
        data = aws_cmd(scan_args)
        items.extend(data.get("Items", []))
        last_key = data.get("LastEvaluatedKey")
        if not last_key:
            break
    return items

def delete_item(pk, sk):
    cmd = [
        "aws", "dynamodb", "delete-item",
        "--table-name", TABLE,
        "--key", json.dumps({"PK": {"S": pk}, "SK": {"S": sk}}),
        "--profile", PROFILE, "--region", REGION,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"ERROR deleting {pk}: {result.stderr}", file=sys.stderr)
        return False
    return True

# 1. Get all pages
print("Scanning for CMS pages...")
pages = scan_all(
    "begins_with(PK, :pk)",
    {":pk": {"S": "CMS_PAGE#"}},
    "PK, SK, slug, createdAt",
)
print(f"Found {len(pages)} pages total")

# 2. Group by slug and find duplicates
from collections import defaultdict
slug_groups = defaultdict(list)
for p in pages:
    slug = p.get("slug", {}).get("S", "")
    created = p.get("createdAt", {}).get("S", "")
    pk = p["PK"]["S"]
    sk = p["SK"]["S"]
    slug_groups[slug].append({"pk": pk, "sk": sk, "created": created})

# For each duplicate group, keep the NEWER one (second seed run), delete the older
pages_to_delete = []
for slug, group in sorted(slug_groups.items()):
    if len(group) > 1:
        # Sort by createdAt, keep the latest
        group.sort(key=lambda x: x["created"])
        for old in group[:-1]:  # Delete all but the newest
            pages_to_delete.append({"slug": slug, **old})
            print(f"  DUPLICATE: {slug:25s} | {old['created']} | {old['pk']} -> DELETE")
        kept = group[-1]
        print(f"  KEEP:      {slug:25s} | {kept['created']} | {kept['pk']}")

if not pages_to_delete:
    print("\nNo duplicate pages found!")
    sys.exit(0)

print(f"\n{len(pages_to_delete)} duplicate pages to delete")

# 3. Get all components
print("\nScanning for CMS components...")
components = scan_all(
    "begins_with(PK, :pk)",
    {":pk": {"S": "CMS_COMPONENT#"}},
    "PK, SK, pageId",
)
print(f"Found {len(components)} components total")

# 4. Find components belonging to duplicate pages
page_ids_to_delete = set()
for p in pages_to_delete:
    # Extract page ID from PK like "CMS_PAGE#uuid"
    page_id = p["pk"].replace("CMS_PAGE#", "")
    page_ids_to_delete.add(page_id)

components_to_delete = []
for c in components:
    page_id = c.get("pageId", {}).get("S", "")
    if page_id in page_ids_to_delete:
        components_to_delete.append({"pk": c["PK"]["S"], "sk": c["SK"]["S"], "pageId": page_id})

print(f"{len(components_to_delete)} orphaned components to delete")

# 5. Delete orphaned components first
if components_to_delete:
    print("\nDeleting orphaned components...")
    for i, c in enumerate(components_to_delete):
        delete_item(c["pk"], c["sk"])
        print(f"  [{i+1}/{len(components_to_delete)}] Deleted component {c['pk']}")

# 6. Delete duplicate pages
print("\nDeleting duplicate pages...")
for i, p in enumerate(pages_to_delete):
    delete_item(p["pk"], p["sk"])
    print(f"  [{i+1}/{len(pages_to_delete)}] Deleted page {p['slug']} ({p['pk']})")

print(f"\nDone! Deleted {len(pages_to_delete)} duplicate pages and {len(components_to_delete)} orphaned components.")
print(f"Remaining: {len(pages) - len(pages_to_delete)} unique pages")
