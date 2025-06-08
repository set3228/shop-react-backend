import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import csv from 'csv-parser';
import type { S3Event } from 'aws-lambda';
import { Readable } from 'stream';

const s3 = new S3Client();
const sqs = new SQSClient();

export async function main (event: S3Event) {
  console.log('S3 Event:', JSON.stringify(event, null, 2));

  try {
    const queueUrl = process.env.SQS_QUEUE_URL!;
    const bucketName = event.Records[0].s3.bucket.name;
    const objectKey = event.Records[0].s3.object.key;

    console.log(`Processing file: ${objectKey} from bucket: ${bucketName}`);

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });

    const response = await s3.send(command);
    const s3Stream = response.Body;
    if (!s3Stream || !(s3Stream instanceof Readable)) {
      throw new Error('Response body is not a readable stream');
    }

    const records: Record<string, any>[] = [];
    const sendPromises: Promise<void>[] = [];

    await new Promise<void>((resolve, reject) => {
      s3Stream
        .pipe(csv())
        .on('data', async (data) => {
          console.log('Parsed record:', data);
          records.push(data);

          const sendPromise = (async () => {
            const sqsCommand = new SendMessageCommand({
              QueueUrl: queueUrl,
              MessageBody: JSON.stringify(data),
            });

            const sqsResponse = await sqs.send(sqsCommand);
            console.log('Record sent to SQS:', sqsResponse.MessageId);
          })();

          sendPromises.push(sendPromise);
        })
        .on('end', async () => {
          try {
            await Promise.all(sendPromises);
            console.log('CSV file successfully processed.');
            resolve();
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          console.error('Error while processing CSV:', error);
          reject(error);
        });
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'File processed successfully', records }),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing file:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error processing file', error: errorMessage }),
    };
  }
};