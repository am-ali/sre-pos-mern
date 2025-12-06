# SRE POS (MERN)

Re-engineered and improved version of the Java POS app using MongoDB, Express, React, and Node. Features admin/cashier roles, inventory, coupons, rentals/returns, audit logs, and persisted carts.

## Project layout
- `server/` Express API with MongoDB/Mongoose, JWT auth, carts, transactions, rentals, coupons, inventory, audit logs, and seed/test scripts.
- `client/` Vite + React UI with login, cashier console (sale/rental/return/unsatisfactory), admin employee management, and inventory view.

## Getting started
1. Install dependencies
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```
2. Configure environment
   ```bash
   cp server/.env.example server/.env
   # edit values for MONGO_URI, JWT_SECRET, etc.
   ```
3. Seed sample data (admin/cashier users, starter items, coupon)
   ```bash
   cd server
   npm run seed
   ```
4. Run the stack
   ```bash
   # API
   cd server && npm run dev
   # Frontend
   cd ../client && npm run dev
   ```
5. Credentials from seed
   - admin / admin123
   - cashier / cashier123

## Tests
- Unit and integration tests (with in-memory Mongo):
  ```bash
  cd server
  npm test
  ```

## Notes
- Default tax rate: 6% (env `DEFAULT_TAX_RATE`).
- Coupons stored server-side; apply before tax.
- Rental returns compute late fees (10% of price per day late per qty) and restock.
- Unsatisfactory returns restock without payment.
- Persistent draft carts enable pause/resume of transactions.
