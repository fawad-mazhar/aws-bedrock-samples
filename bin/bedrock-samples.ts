#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BedrockSamplesStack } from '../lib/bedrock-samples-stack';

const app = new cdk.App();
new BedrockSamplesStack(app, 'bedrock-samples-dev', {
  env: {
    account: 'XXXXXXXXX',
    region: 'us-west-2',
  },
  stage: 'dev',
  prefix: 'hyphy-intel',
  knowledgeBaseEmbeddingModelArn: 'arn:aws:bedrock:us-west-2::foundation-model/amazon.titan-embed-text-v1',
  knowledgeBaseFoundationModelArn: "arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-v2"
})