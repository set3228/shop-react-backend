import * as cdk from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import { ProductService } from './product-service';
import { DynamoTablesConstruct } from './dynamo-tables-construct';
import { SqsQueues } from './sqs-queues';
import { SnsTopics } from './sns-topics';

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dynamoTables = new DynamoTablesConstruct(this, 'DynamoTables');
    const sqsQueues = new SqsQueues(this, 'SqsQueues');
    const snsTopics = new SnsTopics(this, 'SnsTopics');

    new ProductService(this, 'ProductService', {
      dynamoTables,
      catalogItemsQueue: sqsQueues.catalogItemsQueue,
      createProductTopic: snsTopics.createProductTopic,
    });
  }
}