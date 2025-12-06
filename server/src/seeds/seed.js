require('dotenv').config();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Item = require('../models/Item');
const Coupon = require('../models/Coupon');
const Customer = require('../models/Customer');
const { ROLES } = require('../config/constants');

// Employee data from old employeeDatabase.txt
const employeeData = [
  { id: '110001', role: ROLES.ADMIN, firstName: 'Harry', lastName: 'Larry', password: '1' },
  { id: '110002', role: ROLES.CASHIER, firstName: 'Debra', lastName: 'Cooper', password: 'lehigh2016' },
  { id: '110003', role: ROLES.ADMIN, firstName: 'Clayton', lastName: 'Watson', password: 'lehigh2017' },
  { id: '110004', role: ROLES.CASHIER, firstName: 'Seth', lastName: 'Moss', password: 'lehigh2018' },
  { id: '110005', role: ROLES.ADMIN, firstName: 'Amy', lastName: 'Adams', password: '110' },
  { id: '110006', role: ROLES.CASHIER, firstName: 'Mike', lastName: 'Spears', password: 'lehigh' },
  { id: '110009', role: ROLES.ADMIN, firstName: 'John', lastName: 'Candle', password: 'candles' },
  { id: '110011', role: ROLES.CASHIER, firstName: 'Anthony', lastName: 'Hopkins', password: 'theman' },
  { id: '110012', role: ROLES.CASHIER, firstName: 'Robert', lastName: 'Lek', password: 'huehue' },
  { id: '110013', role: ROLES.CASHIER, firstName: 'Johnny', lastName: 'Cage', password: 'mortalkombat' },
  { id: '110014', role: ROLES.CASHIER, firstName: 'Eim', lastName: 'Lou', password: 'cowboybebop' },
  { id: '110015', role: ROLES.CASHIER, firstName: 'Michael', lastName: 'Scott', password: 'thatswhatshesaid' },
];

// Read old item database
function readItemDatabase() {
  try {
    const filePath = path.join(__dirname, '../../../old db files/itemDatabase.txt');
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');
    return lines.map((line) => {
      const [id, name, price, quantity] = line.trim().split(' ');
      return {
        name: name || `Item-${id}`,
        price: parseFloat(price) || 0,
        quantity: parseInt(quantity, 10) || 0,
      };
    });
  } catch (err) {
    console.log('Could not read itemDatabase.txt, using default items'); // eslint-disable-line no-console
    return [
      { name: 'Laptop Sleeve', price: 25, quantity: 20 },
      { name: 'USB-C Cable', price: 10, quantity: 50 },
      { name: 'Mechanical Keyboard', price: 120, quantity: 5 },
    ];
  }
}

// Read old coupon numbers and create coupon data
function readCouponData() {
  try {
    const filePath = path.join(__dirname, '../../../old db files/couponNumber.txt');
    const content = fs.readFileSync(filePath, 'utf-8');
    const codes = content.trim().split('\n').map((c) => c.trim()).filter((c) => c);
    
    // Create coupons with 10% off by default
    return codes.slice(0, 20).map((code) => ({
      code: code.toUpperCase(),
      pctOff: 0.1,
      active: true,
    }));
  } catch (err) {
    console.log('Could not read couponNumber.txt, using default coupon'); // eslint-disable-line no-console
    return [{ code: 'TENOFF', pctOff: 0.1, active: true }];
  }
}

// Read old user/customer rental database
function readCustomerRentals() {
  try {
    const filePath = path.join(__dirname, '../../../old db files/userDatabase.txt');
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n').slice(1); // Skip header
    
    const customers = [];
    for (const line of lines) {
      const parts = line.trim().split(' ');
      if (parts.length < 1) continue;
      
      const phone = parts[0];
      if (!phone || phone.length < 10) continue;
      
      // Parse rental data - format: itemID,date,returned
      const rentals = [];
      for (let i = 1; i < parts.length; i++) {
        const rentalParts = parts[i].split(',');
        if (rentalParts.length === 3) {
          const [itemId, date, returned] = rentalParts;
          // Note: We can't link to actual items without the migration, 
          // so we'll skip the rental details for now
          // In a real scenario, you'd need to map old item IDs to new MongoDB IDs
        }
      }
      
      customers.push({ phone, rentals: [] });
    }
    
    return customers.filter((c) => c.phone && c.phone.length === 10);
  } catch (err) {
    console.log('Could not read userDatabase.txt, skipping customer data'); // eslint-disable-line no-console
    return [];
  }
}

async function seed() {
  await connectDB(process.env.MONGO_URI);
  
  console.log('Clearing existing data...'); // eslint-disable-line no-console
  await Promise.all([
    User.deleteMany({}),
    Item.deleteMany({}),
    Coupon.deleteMany({}),
    Customer.deleteMany({}),
  ]);

  console.log('\nSeeding employees from old employeeDatabase.txt...'); // eslint-disable-line no-console
  const users = await Promise.all(
    employeeData.map(async (emp) =>
      User.create({
        employeeId: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        username: `${emp.firstName.toLowerCase()}.${emp.lastName.toLowerCase()}`,
        passwordHash: await bcrypt.hash(emp.password, 10),
        role: emp.role,
      })
    )
  );
  console.log(`✓ Loaded ${users.length} employees`); // eslint-disable-line no-console

  console.log('\nSeeding items from old itemDatabase.txt...'); // eslint-disable-line no-console
  const itemData = readItemDatabase();
  const items = await Item.insertMany(itemData);
  console.log(`✓ Loaded ${items.length} items`); // eslint-disable-line no-console

  console.log('\nSeeding coupons from old couponNumber.txt...'); // eslint-disable-line no-console
  const couponData = readCouponData();
  const coupons = await Coupon.insertMany(couponData);
  console.log(`✓ Loaded ${coupons.length} coupons`); // eslint-disable-line no-console

  console.log('\nSeeding customers from old userDatabase.txt...'); // eslint-disable-line no-console
  const customerData = readCustomerRentals();
  if (customerData.length > 0) {
    const customers = await Customer.insertMany(customerData);
    console.log(`✓ Loaded ${customers.length} customers`); // eslint-disable-line no-console
  } else {
    console.log('⚠ No customer data loaded'); // eslint-disable-line no-console
  }

  console.log('\n=== Seed Summary ==='); // eslint-disable-line no-console
  console.log(`Employees: ${users.length}`); // eslint-disable-line no-console
  console.log(`Items: ${items.length}`); // eslint-disable-line no-console
  console.log(`Coupons: ${coupons.length}`); // eslint-disable-line no-console
  console.log(`Customers: ${customerData.length}`); // eslint-disable-line no-console
  
  process.exit(0);
}

seed().catch((err) => {
  console.error(err); // eslint-disable-line no-console
  process.exit(1);
});
