import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { SQSEvent } from "aws-lambda";

const lambdaClient = new LambdaClient();
const snsClient = new SNSClient();

interface CreateProductPayload {
  title: string;
  description: string;
  price: number;
}

export async function main(event: SQSEvent) {
  const createProductLambdaName = process.env.CREATE_PRODUCT_LAMBDA_NAME!;
  const createProductTopicArn = process.env.CREATE_PRODUCT_TOPIC_ARN!;

  const addedProducts = [];

  for (const record of event.Records) {
    try {
      const messageBody = JSON.parse(record.body);
      console.log('Processing message:', messageBody);

      const productData: CreateProductPayload = {
        title: messageBody.title,
        description: messageBody.description,
        price: messageBody.price,
      };

      await lambdaClient.send(new InvokeCommand({
        FunctionName: createProductLambdaName,
        Payload: JSON.stringify(productData),
      }));

      addedProducts.push(productData);
    } catch (error) {
      console.error('Error processing message:', record.messageId, error);
    }
  }

  const snsMessage = {
    message: `Products created`,
    addedProducts
  };

  await snsClient.send(
    new PublishCommand({
      TopicArn: createProductTopicArn,
      Message: JSON.stringify(snsMessage),
    })
  );

  console.log(`Published message to SNS: ${JSON.stringify(snsMessage)}`);
}