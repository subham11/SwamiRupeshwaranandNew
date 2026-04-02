#!/bin/bash
# Seed Product Categories and Sample Products for Paid Features
#
# Usage:
#   export API_URL="https://n4vi400a5e.execute-api.ap-south-1.amazonaws.com/prod/api/v1"
#   export AUTH_TOKEN="your-admin-jwt-token"
#   bash scripts/seed-categories-and-products.sh
#
# To get an admin token, login via the site and copy the auth_access_token from localStorage.

set -e

API_URL="${API_URL:-https://n4vi400a5e.execute-api.ap-south-1.amazonaws.com/prod/api/v1}"
AUTH_TOKEN="${AUTH_TOKEN:?Error: Set AUTH_TOKEN env var with an admin JWT token}"

echo "Using API: $API_URL"
echo ""

# --- Create Categories ---
echo "=== Creating Product Categories ==="

create_category() {
  local name="$1" nameHi="$2" desc="$3" descHi="$4" order="$5"
  echo "  Creating: $name"
  curl -s -X POST "$API_URL/products/categories" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d "{
      \"name\": \"$name\",
      \"nameHi\": \"$nameHi\",
      \"description\": \"$desc\",
      \"descriptionHi\": \"$descHi\",
      \"isActive\": true,
      \"displayOrder\": $order
    }" | python3 -m json.tool 2>/dev/null || echo "  (response not JSON)"
  echo ""
}

create_category \
  "Online Meditation Courses" \
  "ऑनलाइन ध्यान पाठ्यक्रम" \
  "Guided meditation programs and courses with Swamiji" \
  "स्वामीजी के साथ निर्देशित ध्यान कार्यक्रम और पाठ्यक्रम" \
  1

create_category \
  "Spiritual Retreats" \
  "आध्यात्मिक शिविर" \
  "Immersive spiritual retreat experiences at the ashram" \
  "आश्रम में गहन आध्यात्मिक शिविर अनुभव" \
  2

create_category \
  "Astrology Consultation" \
  "ज्योतिष परामर्श" \
  "Personal Vedic astrology readings and consultations" \
  "व्यक्तिगत वैदिक ज्योतिष परामर्श और पठन" \
  3

create_category \
  "Sanskrit & Vedanta Classes" \
  "संस्कृत एवं वेदांत कक्षाएं" \
  "Learn Sanskrit language and Vedanta philosophy" \
  "संस्कृत भाषा और वेदांत दर्शन सीखें" \
  4

create_category \
  "Books & Merchandise" \
  "पुस्तकें और सामग्री" \
  "Spiritual books, mala, yantra, and sacred items" \
  "आध्यात्मिक पुस्तकें, माला, यंत्र और पवित्र सामग्री" \
  5

create_category \
  "Satsang Events" \
  "सत्संग कार्यक्रम" \
  "Spiritual gatherings, kirtan, and divine discourse" \
  "आध्यात्मिक सभाएं, कीर्तन और दिव्य प्रवचन" \
  6

echo "=== Categories Created ==="
echo ""

# --- Fetch categories to get IDs ---
echo "=== Fetching Category IDs ==="
CATEGORIES=$(curl -s "$API_URL/products/public/categories")
echo "$CATEGORIES" | python3 -m json.tool 2>/dev/null || echo "$CATEGORIES"
echo ""

echo "=== Done! ==="
echo ""
echo "Next steps:"
echo "1. Note the category IDs from the output above"
echo "2. Create sample products in each category via the admin panel at /admin/products"
echo "3. Or use the admin API: POST $API_URL/products with categoryId set to the respective ID"
