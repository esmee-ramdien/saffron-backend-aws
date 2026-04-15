#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { createApiStack } from '../lib/api-stack';

const app = new cdk.App();
createApiStack(app, 'APIStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
