# Risk Analysis & Testing

This document lists key risks, mitigations, and testing evidence (unit/integration/database tests) for the POS system.

## Top 10 Risks & Mitigations

1) Authentication weaknesses
- Risk: Weak passwords or improper JWT handling.
- Mitigation: Hash passwords with bcrypt, enforce role-based access via middleware, expire tokens.
- Evidence: `server/src/__tests__/auth.integration.test.js` covers login and protected routes.

2) Authorization bypass
- Risk: Admin-only endpoints accessible by cashiers.
- Mitigation: Role checks in `server/src/middleware/auth.js` and scoped routes.
- Evidence: Integration tests assert 403 for insufficient roles.

3) Data integrity (inventory)
- Risk: Negative stock or race conditions on item quantity.
- Mitigation: Validation in `Item` model (min:0), transactional updates via controllers.
- Evidence: Unit tests in `server/src/utils/pricing.test.js` ensure price calc; inventory update paths validated in integration flows.

4) Pricing miscalculations
- Risk: Incorrect discounts or tax calculation.
- Mitigation: Centralize logic in `server/src/utils/pricing.js` with unit tests.
- Evidence: `server/src/__tests__/pricing.test.js` verifies discount application and edge cases.

5) Coupon abuse
- Risk: Multiple uses of single-use coupons or invalid codes.
- Mitigation: Unique `code`, `active` flag, bounds for `pctOff` (0-1), optional `expiresAt`.
- Evidence: Model constraints in `server/src/models/Coupon.js`; integration scenarios validate rejection of inactive/invalid coupons.

6) Customer data quality
- Risk: Invalid phone numbers; inconsistent rental records.
- Mitigation: `Customer.phone` unique and trimmed; rentals embedded with required fields.
- Evidence: Seed script sanitizes input; controllers validate payloads before persistence.

7) Migration inconsistency
- Risk: Legacy IDs not mapped; partial loads.
- Mitigation: Seed script logs fallbacks and totals; plan for legacy→new ID mapping for rentals.
- Evidence: `server/src/seeds/seed.js` messages indicate counts and fallbacks.

8) Error handling gaps
- Risk: Uncaught exceptions leaking internals.
- Mitigation: Central `errorHandler` middleware standardizes responses.
- Evidence: Express app wiring in `server/src/app.js` and route tests exercising errors.

9) Database connectivity
- Risk: Bad `MONGO_URI` or connection drops.
- Mitigation: Config-driven connection with retries; fail-fast in seeds and tests.
- Evidence: `server/src/config/db.js` connects via env; tests run with test DB.

10) Performance under load
- Risk: Slow endpoints with large datasets.
- Mitigation: Lean queries, indexed unique fields, limit payload sizes.
- Evidence: Model-level uniqueness and minimal projections; profiling pending for larger datasets.

## Testing Evidence

- Unit Tests:
  - Pricing: `server/src/__tests__/pricing.test.js` covers discount edge cases and computations.
  - Utilities: Price helpers in `server/src/utils/pricing.js` targeted for deterministic behavior.

- Integration Tests:
  - Auth: `server/src/__tests__/auth.integration.test.js` validates login flow and protected access.
  - Routes/Controllers: End-to-end behaviors through Express routes and middleware.

- Database Tests:
  - Mongoose models enforce schema constraints (unique, min/max), exercised via integration tests.
  - Seed script `server/src/seeds/seed.js` acts as an environment sanity check, clearing and reloading collections.

## How to Run Tests

```bash
cd server
npm install
npm test
```

## Recommended Next Tests

- Add transaction integration tests for inventory decrement and coupon application in a single flow.
- Add customer rental linking with item ID mapping once migration helper is introduced.
- Add error-path tests to assert standardized responses from `errorHandler`.
