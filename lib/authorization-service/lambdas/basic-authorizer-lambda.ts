import { APIGatewayTokenAuthorizerEvent } from 'aws-lambda';

export async function main (event: APIGatewayTokenAuthorizerEvent) {
  const authorizationHeader = event.authorizationToken;

  if (!authorizationHeader) {
    return generatePolicy('user', 'Deny', event.methodArn);
  }

  const encodedCredentials = authorizationHeader.split(' ')[1];
  const decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString('utf-8');
  const [username, password] = decodedCredentials.split(':');

  const storedPassword = process.env[username];
  if (storedPassword && storedPassword === password) {
    return generatePolicy('user', 'Allow', event.methodArn);
  } else {
    return generatePolicy('user', 'Deny', event.methodArn);
  }
};

function generatePolicy(principalId: string, effect: string, resource: string) {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  };
}