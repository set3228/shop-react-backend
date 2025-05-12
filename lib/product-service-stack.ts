import * as cdk from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import { ProductService } from './product-service';
import { DynamoTablesConstruct } from './dynamo-tables-construct';

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new ProductService(this, 'ProductService');
    new DynamoTablesConstruct(this, 'DynamoTables');
  }
}