import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import * as cdk from 'aws-cdk-lib';

export class DynamoTablesConstruct extends Construct {
  public readonly productsTable: dynamodb.Table;
  public readonly stockTable: dynamodb.Table;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.productsTable = new dynamodb.Table(this, 'ProductsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      tableName: 'products',
    });

    this.stockTable = new dynamodb.Table(this, 'StockTable', {
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
        PRODUCTS_TABLE_NAME: this.productsTable.tableName,
        STOCK_TABLE_NAME: this.stockTable.tableName,
      },
    });

    this.productsTable.grantReadWriteData(seedProductsLambda);
    this.stockTable.grantReadWriteData(seedProductsLambda);
  }
}