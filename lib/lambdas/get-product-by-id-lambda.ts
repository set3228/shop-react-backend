// import products from './products.json';
import path from 'node:path';
import fs from 'node:fs';

const productsPath = path.join(__dirname, 'products.json');
const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export async function main(event: any) {
  const productId = event.pathParameters.productId;

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const product = products.find((product: { id: any }) => product.id === productId);

  if (!product) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: 'Product not found' }),
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    };
  }

  return {
    body: JSON.stringify(product),
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  };
}