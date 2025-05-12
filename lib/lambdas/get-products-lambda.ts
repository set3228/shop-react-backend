// import products from './products.json';

import path from 'node:path';
import fs from 'node:fs';

const productsPath = path.join(__dirname, 'products.json');
const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

export async function main() {
  return {
    body: JSON.stringify(products),
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    statusCode: 200,
  };
}