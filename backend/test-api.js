/**
 * End-to-End API Integration Test Suite
 */
const http = require('http');

const app = require('./server');

const PORT = 5500;
let server;

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Starting Automated Test Suite...\n');
  server = app.listen(PORT);

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // Test 1: Health check
    const health = await request('GET', '/api/health');
    assert(health.status === 200 && health.body.status === 'ok', 'GET /api/health returns 200 ok');

    // Test 2: Get all products
    const productsRes = await request('GET', '/api/products');
    assert(productsRes.status === 200 && productsRes.body.count >= 12, `GET /api/products returns ${productsRes.body.count} items`);

    // Test 3: Filter by category
    const fashionRes = await request('GET', '/api/products?category=Fashion');
    assert(fashionRes.status === 200 && fashionRes.body.data.every(p => p.category === 'Fashion'), 'GET /api/products?category=Fashion returns only Fashion items');

    // Test 4: Search filter
    const searchRes = await request('GET', '/api/products?search=Headphones');
    assert(searchRes.status === 200 && searchRes.body.count >= 1 && searchRes.body.data[0].title.includes('Headphones'), 'GET /api/products?search=Headphones matches correctly');

    // Test 5: Sort by price
    const sortRes = await request('GET', '/api/products?sort=price-asc');
    const prices = sortRes.body.data.map(p => p.price);
    const isSorted = prices.slice(1).every((p, i) => p >= prices[i]);
    assert(sortRes.status === 200 && isSorted, 'GET /api/products?sort=price-asc correctly sorts ascending');

    // Test 6: Get single product
    const singleProduct = await request('GET', '/api/products/1');
    assert(singleProduct.status === 200 && singleProduct.body.data.id === 1, 'GET /api/products/1 retrieves product ID 1');

    // Test 7: Get related products
    const relatedRes = await request('GET', '/api/products/1/related');
    assert(relatedRes.status === 200 && Array.isArray(relatedRes.body.data), 'GET /api/products/1/related returns related items');

    // Test 8: Get categories
    const categoriesRes = await request('GET', '/api/products/categories');
    assert(categoriesRes.status === 200 && categoriesRes.body.data.length >= 4, 'GET /api/products/categories returns categories list');

    // Test 9: Validate cart
    const validateRes = await request('POST', '/api/orders/validate-cart', {
      items: [{ id: 1, quantity: 1 }]
    });
    assert(validateRes.status === 200 && validateRes.body.isValid === true, 'POST /api/orders/validate-cart validates valid stock');

    // Test 10: Place an order
    const orderPayload = {
      customer: {
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+1 555-987-6543',
        address: '100 Market St',
        city: 'San Francisco',
        state: 'CA',
        zip: '94105',
        country: 'United States'
      },
      items: [{ id: 1, quantity: 1 }],
      shippingMethod: 'standard',
      paymentMethod: 'credit_card',
      paymentDetails: { cardLast4: '4242' },
      couponCode: 'SAVE10'
    };
    const orderRes = await request('POST', '/api/orders', orderPayload);
    assert(orderRes.status === 201 && orderRes.body.data.id.startsWith('ORD-'), `POST /api/orders places order: ${orderRes.body.data?.id}`);

    const newOrderId = orderRes.body.data.id;

    // Test 11: Track order
    const trackRes = await request('GET', `/api/orders/${newOrderId}`);
    assert(trackRes.status === 200 && trackRes.body.data.customer.fullName === 'Jane Doe', `GET /api/orders/:id tracks placed order`);

    // Test 12: Existing seed order lookup
    const seedOrderRes = await request('GET', '/api/orders/ORD-2026-1001');
    assert(seedOrderRes.status === 200 && seedOrderRes.body.data.id === 'ORD-2026-1001', 'GET /api/orders/ORD-2026-1001 retrieves seed order');

    console.log(`\n========================================`);
    console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
    console.log(`========================================`);

  } catch (err) {
    console.error('Fatal test runner error:', err);
  } finally {
    server.close();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
