const Item = require('../models/Item');

async function listItems(_req, res) {
  const items = await Item.find().lean();
  res.json(items);
}

async function createItem(req, res) {
  const { name, price, quantity } = req.body;
  const item = await Item.create({ name, price, quantity });
  res.status(201).json(item);
}

async function updateItem(req, res) {
  const { id } = req.params;
  const { name, price, quantity } = req.body;
  const item = await Item.findById(id);
  if (!item) return res.status(404).json({ message: 'Item not found' });
  if (name !== undefined) item.name = name;
  if (price !== undefined) item.price = price;
  if (quantity !== undefined) item.quantity = quantity;
  await item.save();
  res.json(item);
}

async function deleteItem(req, res) {
  const { id } = req.params;
  const item = await Item.findById(id);
  if (!item) return res.status(404).json({ message: 'Item not found' });
  await item.deleteOne();
  res.json({ message: 'Item deleted' });
}

module.exports = { listItems, createItem, updateItem, deleteItem };
