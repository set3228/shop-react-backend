import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'node:path';
import { Construct } from 'constructs';

export class ProductService extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const getProductsLambda = new lambda.Function(
      this,
      'get-products-lambda',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(5),
        handler: 'get-products-lambda.main',
        code: lambda.Code.fromAsset(path.join(__dirname, './lambdas')),
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
      },
    );

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
  }
}