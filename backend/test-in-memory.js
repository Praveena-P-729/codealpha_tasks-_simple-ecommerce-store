/**
 * In-Memory Unit & Integration Tests (Zero Network Sockets)
 */
const db = require('./data/db');
const productsRoute = require('./routes/products');
const ordersRoute = require('./routes/orders');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  }
}

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    }
  };
  return res;
}

async function run() {
  console.log('🚀 Running In-Memory Test Suite...\n');

  // Test 1: db.getAllProducts()
  const allProducts = db.getAllProducts();
  assert(allProducts.length >= 12, `db.getAllProducts() returned ${allProducts.length} products`);

  // Test 2: db.getCategories()
  const categories = db.getCategories();
  assert(categories.length >= 4, `db.getCategories() returned ${categories.length} categories`);
  const catNames = categories.map(c => c.name);
  assert(catNames.includes('Electronics') && catNames.includes('Fashion'), 'Categories include Electronics and Fashion');

  // Test 3: db.getProductById()
  const p1 = db.getProductById(1);
  assert(p1 && p1.title.includes('Aura Pro'), `db.getProductById(1) found "${p1?.title}"`);

  // Test 4: db.getOrderById()
  const seedOrder = db.getOrderById('ORD-2026-1001');
  assert(seedOrder && seedOrder.customer.fullName === 'Alex Mercer', `db.getOrderById('ORD-2026-1001') found customer Alex Mercer`);

  // Test 5: db.createOrder() calculation & stock deduction
  const initialStock = db.getProductById(2).stock;
  const newOrder = db.createOrder({
    customer: {
      fullName: 'Test Customer',
      email: 'test@example.com',
      phone: '1234567890',
      address: '123 Main St',
      city: 'Boston',
      state: 'MA',
      zip: '02108',
      country: 'USA'
    },
    items: [{ id: 2, quantity: 2 }],
    shippingMethod: 'standard',
    paymentMethod: 'credit_card',
    paymentDetails: { cardLast4: '9999' },
    couponCode: 'SAVE10'
  });

  assert(newOrder.id.startsWith('ORD-'), `Created new order: ${newOrder.id}`);
  assert(newOrder.pricing.subtotal > 0, `Order subtotal calculated: $${newOrder.pricing.subtotal}`);
  assert(newOrder.pricing.discount > 0, `Coupon discount applied: $${newOrder.pricing.discount}`);
  assert(newOrder.pricing.total > 0, `Order total calculated: $${newOrder.pricing.total}`);

  // Stock check
  const updatedStock = db.getProductById(2).stock;
  assert(updatedStock === initialStock - 2, `Inventory updated: from ${initialStock} to ${updatedStock}`);

  // Test 6: Verify Order Retrieval
  const fetchedOrder = db.getOrderById(newOrder.id);
  assert(fetchedOrder && fetchedOrder.customer.fullName === 'Test Customer', `Retrieved created order from storage`);

  // Test 7: Out-of-Stock Rejection
  let errorThrown = false;
  try {
    db.createOrder({
      customer: { fullName: 'Fail', email: 'f@f.com', phone: '1', address: '1', city: '1', state: '1', zip: '1', country: '1' },
      items: [{ id: 2, quantity: 99999 }]
    });
  } catch (e) {
    errorThrown = true;
  }
  assert(errorThrown, 'Order rejected when quantity exceeds available stock');

  // Test 8: Auth - User Lookup & Verification
  const demoUser = db.getUserByEmail('demo@aurastore.com');
  assert(demoUser && demoUser.password === 'password123', 'Demo user exists in database with valid credentials');

  // Test 9: Auth - User Registration
  const testRegEmail = `user_${Date.now()}@example.com`;
  const registeredUser = db.createUser({
    name: 'New Tester',
    email: testRegEmail,
    password: 'password123'
  });
  assert(registeredUser.email === testRegEmail && registeredUser.name === 'New Tester', 'New user registered successfully');

  // Test 10: Auth - Duplicate Registration Rejection
  let dupError = false;
  try {
    db.createUser({ name: 'Dup', email: testRegEmail, password: 'password123' });
  } catch (e) {
    dupError = true;
  }
  assert(dupError, 'Duplicate email registration rejected');

  console.log(`\n========================================`);
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

run();
