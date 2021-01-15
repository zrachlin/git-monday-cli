// config.js
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  MONDAY_TOKEN: process.env.MONDAY_TOKEN,
  MONDAY_BOARD_ID: process.env.MONDAY_BOARD_ID,
  MONDAY_STATUS_COLUMN_ID: process.env.MONDAY_STATUS_COLUMN_ID,
  MONDAY_ITEM_TYPE_COLUMN_ID: process.env.MONDAY_ITEM_TYPE_COLUMN_ID,
};
