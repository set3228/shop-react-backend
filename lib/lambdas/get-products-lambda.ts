import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const dynamoDB = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dynamoDB);

export async function main() {
  const productsTableName = process.env.PRODUCTS_TABLE_NAME!;
  const stockTableName = process.env.STOCK_TABLE_NAME!;

  try {
    const productsResponse = await docClient.send(new ScanCommand({ TableName: productsTableName }));
    const products = productsResponse.Items || [];

    const stockResponse = await docClient.send(new ScanCommand({ TableName: stockTableName }));
    const stock = stockResponse.Items || [];

    const joinedData = products.map((product) => {
      const stockItem = stock.find((item) => item.product_id === product.id);
      return {
        id: product.id,
        title: product.title,
        description: product.description,
        price: product.price,
        count: stockItem ? stockItem.count : 0,
      };
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(joinedData),
    };
  } catch (error) {
    console.error('Error fetching products:', error);

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
}