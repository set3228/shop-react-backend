import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'node:path';
import type { Construct } from 'constructs';

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const catalogItemsQueueUrl = cdk.Fn.importValue('CatalogItemsQueueUrl');
    const catalogItemsQueueArn = cdk.Fn.importValue('CatalogItemsQueueArn');

    const importBucket = new s3.Bucket(this, 'ImportBucket', {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedOrigins: ['*'],
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
            s3.HttpMethods.HEAD,
          ],
          allowedHeaders: ['*'],
          exposedHeaders: ['ETag'],
          maxAge: 3000,
        },
      ],
    });

    const importProductsFileLambda = new lambda.Function(
      this,
      'import-products-file',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(5),
        handler: 'import-products-file-lambda.main',
        code: lambda.Code.fromAsset(path.join(__dirname, './lambdas')),
        environment: {
          BUCKET_NAME: importBucket.bucketName,
        },
      },
    );

    importBucket.grantReadWrite(importProductsFileLambda);

    const importFileParserLambda = new lambda.Function(
      this,
      'import-file-parser-lambda',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(5),
        handler: 'import-file-parser-lambda.main',
        code: lambda.Code.fromAsset(path.join(__dirname, './lambdas')),
        environment: {
          SQS_QUEUE_URL: catalogItemsQueueUrl,
        },
      }
    );

    importBucket.grantRead(importFileParserLambda);

    importFileParserLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['sqs:SendMessage'],
        resources: [catalogItemsQueueArn],
      })
    );

    importBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(importFileParserLambda),
      { prefix: 'uploaded/' }
    );

    const api = new apigateway.RestApi(this, 'ImportServiceApi', {
      restApiName: 'Import Service API',
    });

    const importResource = api.root.addResource('import');
    importResource.addMethod('GET', new apigateway.LambdaIntegration(importProductsFileLambda));
  }
}