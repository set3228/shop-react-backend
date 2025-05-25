import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent } from 'aws-lambda';

const dynamoDB = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dynamoDB);

export async function main(event: APIGatewayProxyEvent) {
  const productId = event.pathParameters?.productId;
  const productsTableName = process.env.PRODUCTS_TABLE_NAME!;
  const stockTableName = process.env.STOCK_TABLE_NAME!;

  try {
    const productResponse = await docClient.send(
      new GetCommand({
        TableName: productsTableName,
        Key: { id: productId },
      })
    );

    const product = productResponse.Item;

    if (!product) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Product not found' }),
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      };
    }

    const stockResponse = await docClient.send(
      new GetCommand({
        TableName: stockTableName,
        Key: { product_id: productId },
      })
    );

    const stock = stockResponse.Item;

    const joinedData = {
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      count: stock ? stock.count : 0,
    };

    return {
      body: JSON.stringify(joinedData),
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    };
  } catch (error) {
    console.error('Error fetching product or stock:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    };
  }
}