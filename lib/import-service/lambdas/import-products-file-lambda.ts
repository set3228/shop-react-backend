import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { APIGatewayProxyEvent } from 'aws-lambda';

const s3 = new S3Client();

export async function main (event: APIGatewayProxyEvent) {
  try {
    const fileName = event.queryStringParameters?.name;

    if (!fileName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing file name in query parameters' }),
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Allow-Methods': '*',
        },
      };
    }

    const bucketName = process.env.BUCKET_NAME!;
    const key = `uploaded/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 60 });

    return {
      statusCode: 200,
      body: JSON.stringify(signedUrl),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
      },
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
      },
    };
  }
};