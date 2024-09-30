import { Aws, Duration, RemovalPolicy, Stack, StackProps, CfnOutput, CustomResource} from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { KnowledgeBase } from '../constructs/knowledgebase'
import { Api } from '../constructs/api'

interface BedrockSamplesStackProps extends StackProps {
  stage: string
  prefix: string
}


export class BedrockSamplesStack extends Stack {
  constructor(scope: Construct, id: string, props: BedrockSamplesStackProps) {
    super(scope, id, props);

    const kb = new KnowledgeBase(this, `${props.prefix}-bedrock-knowledgebase-${props.stage}`, {
      account: this.account,
      stage: props.stage,
      prefix: props.prefix
    })

    const api = new Api(this, `${props.prefix}-bedrock-api-${props.stage}`, {
      account: this.account,
      stage: props.stage,
      prefix: props.prefix
    })
    

  } // end constructor
}
