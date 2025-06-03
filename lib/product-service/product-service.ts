import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'node:path';
import { Construct } from 'constructs';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Queue } from "aws-cdk-lib/aws-sqs";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { Topic } from 'aws-cdk-lib/aws-sns';

interface ProductServiceProps {
  dynamoTables: {
    productsTable: Table;
    stockTable: Table;
  },
  catalogItemsQueue: Queue,
  createProductTopic: Topic
}

export class ProductService extends Construct {
  constructor(scope: Construct, id: string, props: ProductServiceProps) {
    super(scope, id);

    const { dynamoTables: { productsTable, stockTable }, catalogItemsQueue, createProductTopic } = props;

    const getProductsLambda = new lambda.Function(
      this,
      'get-products-lambda',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(5),
        handler: 'get-products-lambda.main',
        code: lambda.Code.fromAsset(path.join(__dirname, './lambdas')),
        environment: {
          PRODUCTS_TABLE_NAME: productsTable.tableName,
          STOCK_TABLE_NAME: stockTable.tableName,
        },
      },
    );

    const getProductByIdLambda = new lambda.Function(
      this,
      'get-product-by-id-lambda',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(5),
        handler: 'get-product-by-id-lambda.main',
        code: lambda.Code.fromAsset(path.join(__dirname, './lambdas')),
        environment: {
          PRODUCTS_TABLE_NAME: productsTable.tableName,
          STOCK_TABLE_NAME: stockTable.tableName,
        },
      },
    );

    const createProductLambda = new lambda.Function(
      this,
      'create-product-lambda',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(5),
        handler: 'create-product-lambda.main',
        code: lambda.Code.fromAsset(path.join(__dirname, './lambdas')),
        environment: {
          PRODUCTS_TABLE_NAME: productsTable.tableName,
        },
      },
    );

    const catalogBatchProcessLambda = new lambda.Function(
      this,
      'catalog-batch-process',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(5),
        handler: 'catalog-batch-process.main',
        code: lambda.Code.fromAsset(path.join(__dirname, "./lambdas")),
        environment: {
          CREATE_PRODUCT_LAMBDA_NAME: createProductLambda.functionName,
          CREATE_PRODUCT_TOPIC_ARN: createProductTopic.topicArn,
        },
      }
    );

    productsTable.grantReadData(getProductsLambda);
    stockTable.grantReadData(getProductsLambda);

    productsTable.grantReadData(getProductByIdLambda);
    stockTable.grantReadData(getProductByIdLambda);

    productsTable.grantWriteData(createProductLambda);

    createProductLambda.grantInvoke(catalogBatchProcessLambda);

    catalogItemsQueue.grantConsumeMessages(catalogBatchProcessLambda);
    createProductTopic.grantPublish(catalogBatchProcessLambda);

    catalogBatchProcessLambda.addEventSource(new SqsEventSource(catalogItemsQueue, { 
      batchSize: 5,
      maxBatchingWindow: cdk.Duration.seconds(5)
    }));

    const api = new apigateway.RestApi(this, 'product-service-api', {
      restApiName: 'Product Service API Gateway',
      description: 'This API serves the Lambda functions.',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    const getProductsLambdaIntegration = new apigateway.LambdaIntegration(
      getProductsLambda,
    );

    const productsResource = api.root.addResource('products');

    productsResource.addMethod('GET', getProductsLambdaIntegration);

    const getProductByIdLambdaIntegration = new apigateway.LambdaIntegration(
      getProductByIdLambda,
    );

    const productDataResource = productsResource.addResource('{productId}');

    productDataResource.addMethod('GET', getProductByIdLambdaIntegration);

    const createProductLambdaIntegration = new apigateway.LambdaIntegration(
      createProductLambda,
    );

    productsResource.addMethod('POST', createProductLambdaIntegration);
  }
}