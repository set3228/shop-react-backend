import { v4 as uuidv4 } from 'uuid';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const dynamoDB = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dynamoDB);

export const main = async () => {
  const productsTableName = process.env.PRODUCTS_TABLE_NAME!;
  const stockTableName = process.env.STOCK_TABLE_NAME!;

  const products = [
    { title: "Wildflower Honey", description: "Sweet and floral honey from wildflowers.", price: 12 },
    { title: "Buckwheat Honey", description: "Rich and dark honey with a malty flavor.", price: 15 },
    { title: "Clover Honey", description: "Light and sweet honey with a mild taste.", price: 10 },
    { title: "Acacia Honey", description: "Delicate honey with a fruity and floral aroma.", price: 18 },
    { title: "Manuka Honey", description: "Golden honey with a robust and earthy flavor.", price: 14 },
    { title: "Orange Blossom Honey", description: "Sweet honey with hints of citrus and herbs.", price: 16 },
    { title: "Chestnut Honey", description: "Rich honey with a nutty and caramel-like taste.", price: 20 },
    { title: "Eucalyptus Honey", description: "Golden honey with a mild and buttery flavor.", price: 13 },
  ];

  for (const product of products) {
    const productId = uuidv4();
    const stockCount = Math.floor(Math.random() * 20) + 1;

    await docClient.send(
      new PutCommand({
        TableName: productsTableName,
        Item: {
          id: productId,
          title: product.title,
          description: product.description,
          price: product.price,
        },
      })
    );

    await docClient.send(
      new PutCommand({
        TableName: stockTableName,
        Item: {
          product_id: productId,
          count: stockCount,
        },
      })
    );
  }

  console.log('Test data inserted successfully');
};