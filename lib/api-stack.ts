import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigwv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambda_nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

const HANDLERS_DIR ='lambda/handlers'

type RouteDef = {
  readonly id: string;
  readonly path: string;
  readonly method: apigwv2.HttpMethod;
  readonly entry: string;
};

/** Order matters: register more specific paths (e.g. /recipes/public) before /recipes/{id}. */
const ROUTES: RouteDef[] = [
  { id: 'AuthRegister', path: '/auth/register', method: apigwv2.HttpMethod.POST, entry: 'auth-register.ts' },
  { id: 'AuthLogin', path: '/auth/login', method: apigwv2.HttpMethod.POST, entry: 'auth-login.ts' },

  { id: 'RecipesPublic', path: '/recipes/public', method: apigwv2.HttpMethod.GET, entry: 'recipes-public.ts' },
  { id: 'RecipeSavePost', path: '/recipes/{id}/save', method: apigwv2.HttpMethod.POST, entry: 'recipes-id-save-post.ts' },
  { id: 'RecipeSaveDelete', path: '/recipes/{id}/save', method: apigwv2.HttpMethod.DELETE, entry: 'recipes-id-save-delete.ts' },
  { id: 'RecipeByIdGet', path: '/recipes/{id}', method: apigwv2.HttpMethod.GET, entry: 'recipes-id-get.ts' },
  { id: 'RecipeByIdPut', path: '/recipes/{id}', method: apigwv2.HttpMethod.PUT, entry: 'recipes-id-put.ts' },
  { id: 'RecipeByIdDelete', path: '/recipes/{id}', method: apigwv2.HttpMethod.DELETE, entry: 'recipes-id-delete.ts' },
  { id: 'RecipesPost', path: '/recipes', method: apigwv2.HttpMethod.POST, entry: 'recipes-post.ts' },

  { id: 'MeStats', path: '/me/stats', method: apigwv2.HttpMethod.GET, entry: 'me-stats.ts' },
  { id: 'MeRecipes', path: '/me/recipes', method: apigwv2.HttpMethod.GET, entry: 'me-recipes.ts' },
  { id: 'MeSaved', path: '/me/saved', method: apigwv2.HttpMethod.GET, entry: 'me-saved.ts' },
];

export const createApiStack = (scope: Construct, id: string, props?: cdk.StackProps): cdk.Stack => {
  const stack = new cdk.Stack(scope, id, props);

  const httpApi = new apigwv2.HttpApi(stack, 'Saffron', {
    apiName: 'Saffron',
    corsPreflight: {
      allowHeaders: ['authorization', 'content-type'],
      allowMethods: [
        apigwv2.CorsHttpMethod.GET,
        apigwv2.CorsHttpMethod.POST,
        apigwv2.CorsHttpMethod.PUT,
        apigwv2.CorsHttpMethod.DELETE,
        apigwv2.CorsHttpMethod.OPTIONS,
      ],
      allowOrigins: ['*'],
    },
  });

  const defaultFnProps: lambda_nodejs.NodejsFunctionProps = {
    runtime: lambda.Runtime.NODEJS_22_X,
    handler: 'handler',
    bundling: {
      minify: true,
      sourceMap: true,
      target: 'node22',
    },
    timeout: cdk.Duration.seconds(30),
    memorySize: 256,
    environment: {
      NODE_OPTIONS: '--enable-source-maps',
      MONGODB_URI: StringParameter.valueForStringParameter(stack, '/saffron/MONGODB_URI'),
      JWT_SECRET: StringParameter.valueForStringParameter(stack, '/saffron/JWT_SECRET'),
    },
  };

  for (const route of ROUTES) {
    const fn = new lambda_nodejs.NodejsFunction(stack, `${route.id}Fn`, {
      ...defaultFnProps,
      functionName: `saffron-${route.id.toLowerCase()}`,
      entry: path.join(HANDLERS_DIR, route.entry),
    });

    const integration = new apigwv2Integrations.HttpLambdaIntegration(
      `${route.id}Integration`,
      fn
    );

    httpApi.addRoutes({
      path: route.path,
      methods: [route.method],
      integration,
    });
  }

  new cdk.CfnOutput(stack, 'HttpApiUrl', {
    value: httpApi.apiEndpoint,
    description: 'Base URL for the HTTP API',
  });

  return stack;
};
