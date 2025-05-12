import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import * as cdk from 'aws-cdk-lib';

export class DynamoTablesConstruct extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const productsTable = new dynamodb.Table(this, 'ProductsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      tableName: 'products',
    });

    const stockTable = new dynamodb.Table(this, 'StockTable', {
      partitionKey: { name: 'product_id', type: dynamodb.AttributeType.STRING },
      tableName: 'stock',
    });

    const seedProductsLambda = new lambda.Function(this, 'seed-products-lambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: 'seed-products-lambda.main',
      code: lambda.Code.fromAsset(path.join(__dirname, './lambdas')),
      environment: {
        PRODUCTS_TABLE_NAME: productsTable.tableName,
        STOCK_TABLE_NAME: stockTable.tableName,
      },
    });

    productsTable.grantReadWriteData(seedProductsLambda);
    stockTable.grantReadWriteData(seedProductsLambda);
  }
}