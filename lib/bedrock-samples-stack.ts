import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { KnowledgeBase } from '../constructs/knowledgebase'
import { Api } from '../constructs/api'

interface BedrockSamplesStackProps extends StackProps {
  stage: string
  prefix: string
  knowledgeBaseEmbeddingModelArn: string
  knowledgeBaseFoundationModelArn: string
}


export class BedrockSamplesStack extends Stack {
  constructor(scope: Construct, id: string, props: BedrockSamplesStackProps) {
    super(scope, id, props);

    const kb = new KnowledgeBase(this, `${props.prefix}-bedrock-knowledgebase-${props.stage}`, {
      account: this.account,
      stage: props.stage,
      prefix: props.prefix,
      knowledgeBaseEmbeddingModelArn: props.knowledgeBaseEmbeddingModelArn
    })

    new Api(this, `${props.prefix}-bedrock-api-${props.stage}`, {
      account: this.account,
      stage: props.stage,
      prefix: props.prefix,
      knowledgeBaseFoundationModelArn: props.knowledgeBaseFoundationModelArn,
      knowledgeBaseBucketArn: kb.knowledgeBaseBucketArn,
      knowledgeBaseId: kb.knowledgeBaseId,
      knowledgeBaseArn: kb.knowledgeBaseArn,
      collectionArn: kb.collectionArn,
      collectionId: kb.collectionId,
      collectionName: kb.collectionName,
      collectionEndpoint: kb.collectionEndpoint,
      bedrockDataSourceId: kb.dataSourceId
    })
    

  } // end constructor
}
