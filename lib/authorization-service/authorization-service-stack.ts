import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

const envVariables: { [key: string]: string } = Object.entries(dotenv.parse(fs.readFileSync('.env')))
  .reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {} as { [key: string]: string });

export class AuthorizationServiceStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const basicAuthorizerLambda = new lambda.Function(
      this,
      'basic-authorizer-lambda',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(5),
        handler: 'basic-authorizer-lambda.main',
        code: lambda.Code.fromAsset(path.join(__dirname, './lambdas')),
        environment: envVariables,
      }
    );

    new cdk.CfnOutput(this, 'BasicAuthorizerLambdaArn', {
      value: basicAuthorizerLambda.functionArn,
      exportName: 'BasicAuthorizerLambdaArn',
    });
  }
}