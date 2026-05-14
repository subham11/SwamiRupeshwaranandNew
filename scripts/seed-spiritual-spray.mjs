#!/usr/bin/env node
/**
 * Seed the "Spiritual Spray" product (Shubh Sinchanam) with 4 size variants.
 *
 * Steps:
 *   1. Ensure a "Spiritual Products" category exists (creates if missing).
 *   2. Scrape product images from the source site and upload them to S3
 *      via the admin presigned-URL endpoint.
 *   3. Create the product with 4 size/price variants.
 *
 * Usage:
 *   API_URL=https://<api-host>/api/v1 \
 *   AUTH_TOKEN=<admin-jwt> \
 *   node scripts/seed-spiritual-spray.mjs
 *
 * Optional:
 *   SOURCE_URL  override the page scraped for images
 *                (default: https://swamirupeshwaranand.in/spiritual-spray/)
 *   SKIP_IMAGES=1  create the product without images
 */

const API_URL = process.env.API_URL;
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const SOURCE_URL =
  process.env.SOURCE_URL || 'https://swamirupeshwaranand.in/spiritual-spray/';
const SKIP_IMAGES = process.env.SKIP_IMAGES === '1';

if (!API_URL || !AUTH_TOKEN) {
  console.error('ERROR: API_URL and AUTH_TOKEN env vars are required.');
  process.exit(1);
}

const authHeaders = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${AUTH_TOKEN}`,
};

async function api(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...authHeaders, ...(options.headers || {}) },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    throw new Error(`${options.method || 'GET'} ${path} -> ${res.status}: ${text}`);
  }
  return body;
}

// ---------------------------------------------------------------------------
// 1. Category
// ---------------------------------------------------------------------------
async function ensureCategory() {
  const list = await api('/products/public/categories');
  const items = list.items || [];
  const existing = items.find(
    (c) => c.slug === 'spiritual-products' || c.name === 'Spiritual Products',
  );
  if (existing) {
    console.log(`Category exists: ${existing.name} (${existing.id})`);
    return existing.id;
  }
  const created = await api('/products/categories', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Spiritual Products',
      nameHi: 'आध्यात्मिक उत्पाद',
      description: 'Sacred sprays, yantras and other spiritual items.',
      descriptionHi: 'पवित्र स्प्रे, यंत्र एवं अन्य आध्यात्मिक वस्तुएँ।',
      isActive: true,
      displayOrder: 10,
    }),
  });
  console.log(`Category created: ${created.name} (${created.id})`);
  return created.id;
}

// ---------------------------------------------------------------------------
// 2. Images — scrape source page, upload to S3
// ---------------------------------------------------------------------------
function extractImageUrls(html) {
  const urls = new Set();
  const re = /https?:\/\/[^\s"'<>]+?\.(?:jpe?g|png|webp)/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const u = m[0];
    // skip obvious non-product assets
    if (/logo|favicon|icon|sprite|placeholder|avatar/i.test(u)) continue;
    urls.add(u);
  }
  return [...urls].slice(0, 5);
}

async function uploadImages() {
  if (SKIP_IMAGES) {
    console.log('SKIP_IMAGES=1 — skipping image upload.');
    return [];
  }
  let html;
  try {
    html = await (await fetch(SOURCE_URL)).text();
  } catch (e) {
    console.warn(`Could not fetch source page (${e.message}) — continuing without images.`);
    return [];
  }
  const imageUrls = extractImageUrls(html);
  if (imageUrls.length === 0) {
    console.warn('No product images found on source page — continuing without images.');
    return [];
  }
  console.log(`Found ${imageUrls.length} candidate image(s); uploading...`);

  const keys = [];
  for (const url of imageUrls) {
    try {
      const imgRes = await fetch(url);
      if (!imgRes.ok) throw new Error(`fetch ${imgRes.status}`);
      const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
      const buf = Buffer.from(await imgRes.arrayBuffer());
      const fileName = url.split('/').pop().split('?')[0] || `spray-${keys.length + 1}.jpg`;

      const presigned = await api('/products/upload/presigned-url', {
        method: 'POST',
        body: JSON.stringify({ fileName, contentType }),
      });

      const put = await fetch(presigned.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: buf,
      });
      if (!put.ok) throw new Error(`S3 PUT ${put.status}`);

      keys.push(presigned.key);
      console.log(`  uploaded ${fileName} -> ${presigned.key}`);
    } catch (e) {
      console.warn(`  skipped ${url}: ${e.message}`);
    }
  }
  return keys;
}

// ---------------------------------------------------------------------------
// 3. Product
// ---------------------------------------------------------------------------
const DESCRIPTION_EN = `Shubh Sinchanam is an energetic protection spray created under the guidance of Swami Rupeshwaranand. It is formulated with gaumutra (cow urine), Gangajal (holy Ganga water) and other sacred, pure elements to shield against subtle negative forces and invisible obstacles.

Benefits:
• Purifies the atmosphere and personal aura
• Supports mental peace and spiritual balance
• Ideal for yajnas, worship spaces, home, workplace and vehicles
• Chemical-free and environmentally safe

Usage: Spray daily or as needed in your home, puja sthal, workplace or vehicle. May also be applied around the crown chakra area.`;

const DESCRIPTION_HI = `शुभ सिंचनम स्वामी रूपेश्वरानंद जी के मार्गदर्शन में निर्मित एक ऊर्जावान आध्यात्मिक रक्षा स्प्रे है। यह गौमूत्र, गंगाजल तथा अन्य पवित्र एवं शुद्ध तत्वों से बनाया गया है, जो सूक्ष्म नकारात्मक शक्तियों एवं अदृश्य बाधाओं से रक्षा करता है।

लाभ:
• वातावरण एवं व्यक्तिगत आभामंडल की शुद्धि
• मानसिक शांति एवं आध्यात्मिक संतुलन
• यज्ञ, पूजा स्थल, घर, कार्यस्थल एवं वाहन हेतु उपयुक्त
• रसायन रहित एवं पर्यावरण के अनुकूल

प्रयोग विधि: प्रतिदिन या आवश्यकता अनुसार घर, पूजा स्थल, कार्यस्थल या वाहन में छिड़काव करें।`;

async function createProduct(categoryId, images) {
  const payload = {
    title: 'Shubh Sinchanam — Spiritual Protection Spray',
    titleHi: 'शुभ सिंचनम — आध्यात्मिक रक्षा स्प्रे',
    subtitle: 'Energetic protection spray with Gaumutra & Gangajal',
    subtitleHi: 'गौमूत्र एवं गंगाजल युक्त आध्यात्मिक रक्षा स्प्रे',
    description: DESCRIPTION_EN,
    descriptionHi: DESCRIPTION_HI,
    categoryId,
    price: 210, // overridden by backend to lowest variant price
    images,
    tags: ['spray', 'spiritual', 'protection', 'puja', 'yajna'],
    stockStatus: 'in_stock',
    isFeatured: true,
    isActive: true,
    displayOrder: 1,
    variants: [
      { label: '20ml', labelHi: '20 मि.ली.', price: 210 },
      { label: '30ml', labelHi: '30 मि.ली.', price: 240 },
      { label: '50ml', labelHi: '50 मि.ली.', price: 300 },
      { label: '100ml', labelHi: '100 मि.ली.', price: 450 },
    ],
  };
  const created = await api('/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return created;
}

// ---------------------------------------------------------------------------
async function main() {
  console.log(`Seeding Spiritual Spray against ${API_URL}`);
  const categoryId = await ensureCategory();
  const images = await uploadImages();
  const product = await createProduct(categoryId, images);
  console.log('\n✅ Product created:');
  console.log(`   id:    ${product.id}`);
  console.log(`   slug:  ${product.slug}`);
  console.log(`   price: from ₹${product.price}`);
  console.log(`   path:  /products/${product.slug}`);
}

main().catch((e) => {
  console.error('\n❌ Seed failed:', e.message);
  process.exit(1);
});
