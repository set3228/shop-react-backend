import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as sqs from "aws-cdk-lib/aws-sqs";

export class SqsQueues extends Construct {
  public readonly catalogItemsQueue: sqs.Queue;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.catalogItemsQueue = new sqs.Queue(this, "catalogItemsQueue");

    new cdk.CfnOutput(this, 'CatalogItemsQueueUrl', {
      value: this.catalogItemsQueue.queueUrl,
      exportName: 'CatalogItemsQueueUrl',
    });

    new cdk.CfnOutput(this, 'CatalogItemsQueueArn', {
      value: this.catalogItemsQueue.queueArn,
      exportName: 'CatalogItemsQueueArn',
    });
  }
}