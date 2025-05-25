import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';

const dynamoDB = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dynamoDB);

interface CreateProductEvent {
  title: string;
  description: string;
  price: number;
}

export async function main(event: APIGatewayProxyEvent) {
  const productsTableName = process.env.PRODUCTS_TABLE_NAME!;
  const body = JSON.parse(event.body || "{}") as CreateProductEvent;

  if (!body.title || !body.description || !body.price) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing required fields" }),
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    };
  }

  try {
    const createdProduct = {
      id: uuidv4(),
      title: body.title,
      description: body.description,
      price: body.price,
    };

    await docClient.send(
      new PutCommand({
        TableName: productsTableName,
        Item: createdProduct,
      })
    );

    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(createdProduct),
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