const { v4: uuidv4 } = require('uuid');

function invoiceId() {
  return `INV-${uuidv4()}`;
}

module.exports = { invoiceId };
