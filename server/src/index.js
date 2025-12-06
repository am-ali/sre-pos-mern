require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDB(process.env.MONGO_URI);
  app.listen(PORT, () => {
    console.log(`API listening on :${PORT}`); // eslint-disable-line no-console
  });
}

start().catch((err) => {
  console.error(err); // eslint-disable-line no-console
  process.exit(1);
});
