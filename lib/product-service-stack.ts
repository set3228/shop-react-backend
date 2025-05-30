import * as cdk from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import { ProductService } from './product-service';
import { DynamoTablesConstruct } from './dynamo-tables-construct';

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dynamoTables = new DynamoTablesConstruct(this, 'DynamoTables');

    new ProductService(this, 'ProductService', { dynamoTables });
  }
}