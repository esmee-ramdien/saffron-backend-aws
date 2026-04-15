import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { json } from '../shared/http';

export const handler = async (_event: APIGatewayProxyEventV2) => {
  return json(200, { ok: true });
};
