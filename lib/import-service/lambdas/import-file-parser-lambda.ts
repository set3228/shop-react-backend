import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import csv from 'csv-parser';
import type { S3Event } from 'aws-lambda';
import { Readable } from 'stream';

const s3 = new S3Client();

export async function main (event: S3Event) {
  console.log('S3 Event:', JSON.stringify(event, null, 2));

  try {
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
    await new Promise<void>((resolve, reject) => {
      s3Stream
        .pipe(csv())
        .on('data', (data) => {
          console.log('Parsed record:', data);
          records.push(data);
        })
        .on('end', () => {
          console.log('CSV file successfully processed.');
          resolve();
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