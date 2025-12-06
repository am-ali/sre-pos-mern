require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Item = require('../models/Item');
const Coupon = require('../models/Coupon');
const { ROLES } = require('../config/constants');

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

async function seed() {
  await connectDB(process.env.MONGO_URI);
  await Promise.all([User.deleteMany({}), Item.deleteMany({}), Coupon.deleteMany({})]);

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

  await Item.insertMany([
    { name: 'Laptop Sleeve', price: 25, quantity: 20 },
    { name: 'USB-C Cable', price: 10, quantity: 50 },
    { name: 'Mechanical Keyboard', price: 120, quantity: 5 },
  ]);

  await Coupon.create({ code: 'TENOFF', pctOff: 0.1, active: true });

  console.log(`Seed complete: ${users.length} employees loaded`); // eslint-disable-line no-console
  users.forEach((u) => {
    console.log(`  ${u.employeeId} ${u.firstName} ${u.lastName} (${u.username} / ${u.role})`); // eslint-disable-line no-console
  });
  process.exit(0);
}

seed().catch((err) => {
  console.error(err); // eslint-disable-line no-console
  process.exit(1);
});
