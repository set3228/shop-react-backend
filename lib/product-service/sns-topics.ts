import { Construct } from 'constructs';
import * as sns from "aws-cdk-lib/aws-sns";
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';

export class SnsTopics extends Construct {
  public readonly createProductTopic: sns.Topic;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.createProductTopic = new sns.Topic(this, "create-product-topic");

    // Note: probably there is a better way to define email
    const email = '2018ynwa@gmail.com';
    
    this.createProductTopic.addSubscription(
      new snsSubscriptions.EmailSubscription(email)
    );
  }
}