#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BedrockSamplesStack } from '../lib/bedrock-samples-stack';

const app = new cdk.App();
new BedrockSamplesStack(app, 'bedrock-samples-dev', {
  env: {
    account: 'XXXXXXXXXXXX',
    region: 'us-west-2',
  },
  stage: 'dev',
  prefix: 'zappy-sample',
})