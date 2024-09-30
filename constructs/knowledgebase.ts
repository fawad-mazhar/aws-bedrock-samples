import { Aws, Duration, RemovalPolicy, Stack, StackProps, CfnOutput, CustomResource} from 'aws-cdk-lib'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs"
import { RetentionDays } from 'aws-cdk-lib/aws-logs'
import { PolicyStatement, Role, ServicePrincipal, PolicyDocument, ManagedPolicy, CompositePrincipal, ArnPrincipal } from 'aws-cdk-lib/aws-iam'
import { Provider } from 'aws-cdk-lib/custom-resources'
import { Construct } from 'constructs'
import * as path from 'path'

export interface KnowledgeBaseProps extends StackProps {
  account: string
  stage: string
  prefix: string
}

export class KnowledgeBase extends Construct {

  knowledgeBaseId: string
  knowledgeBaseArn: string
  collectionArn: string
  collectionId: string
  collectionName: string
  collectionEndpoint: string
  dataSourceId: string

  constructor(scope: Construct, id: string, props: KnowledgeBaseProps) {
    super(scope, id);

    /**
     * Amazon Bedrock Knowledgebase Source Bucket
     */
    const kbBucket = new s3.Bucket(this, `${props.prefix}-${props.account}-kb-${props.stage}`, {
      bucketName: `${props.prefix}-${props.account}-kb-${props.stage}`,
      cors: [{
        allowedMethods: [s3.HttpMethods.POST],
        allowedOrigins: ["*"],
        allowedHeaders: ["*"]
      }],
      removalPolicy: RemovalPolicy.DESTROY,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      autoDeleteObjects: true,
    })
    
    new CfnOutput(this, `${props.prefix}-${props.account}-kb-${props.stage}-output`, {
      description: "S3 bucket as Amazon Knowledgebase source.",
      value: `${props.prefix}-${props.account}-assets-${props.stage}`,      
    })

    // Ensure that the data is uploaded as part of the deployment
    new s3deploy.BucketDeployment(this, `${props.prefix}-${props.account}-kb-deployment-${props.stage}`, {
      sources: [s3deploy.Source.asset(path.join(__dirname, '/../kb-data/'))],
      destinationBucket: kbBucket,
      destinationKeyPrefix: 'knowledgeBase'
    })


    const kbCustomResourceRole = new Role(this, `${props.prefix}-${props.account}-kb-custom-role-${props.stage}`, {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        ['bedrockPolicy']: new PolicyDocument({
          statements: [
            new PolicyStatement({
              resources: ['*'],
              actions: [
                'bedrock:*KnowledgeBase',
                'bedrock:*DataSource',
                'iam:PassRole',
              ],
            }),
          ],
        }),
        ['ssmPolicy']: new PolicyDocument({
          statements: [
            new PolicyStatement({
              resources: [
                `arn:aws:ssm:${Stack.of(this).region}:${
                  Stack.of(this).account
                }:parameter/${props.prefix}*`,
              ],
              actions: [
                'ssm:PutParameter',
                'ssm:GetParameter',
                'ssm:DeleteParameter',
              ],
            }),
          ],
        }),
        ['aossPolicy']: new PolicyDocument({
          statements: [
            new PolicyStatement({
              resources: ['*'],
              actions: ['aoss:*', 'iam:CreateServiceLinkedRole'],
            }),
          ],
        }),
      },
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole',
        ),
      ],
    })


    /**
     * Amazon Bedrock Knowledgebase Role
     */
    const kbRole = new Role(this, `${props.prefix}-${props.account}-kb-role-${props.stage}`, {
      assumedBy: new CompositePrincipal(
        new ServicePrincipal('bedrock.amazonaws.com'),
        new ServicePrincipal('lambda.amazonaws.com'),
        new ArnPrincipal(kbCustomResourceRole.roleArn),
      ),
      inlinePolicies: {
        ['bedrockPolicy']: new PolicyDocument({
          statements: [
            new PolicyStatement({
              resources: [
                'arn:aws:bedrock:us-west-2::foundation-model/amazon.titan-embed-text-v1',
              ],
              actions: ['bedrock:InvokeModel'],
            }),
          ],
        }),
        ['aossPolicy']: new PolicyDocument({
          statements: [
            new PolicyStatement({
              resources: ['*'],
              actions: ['aoss:*'],
            }),
          ],
        }),
      },
    });

    kbBucket.grantReadWrite(kbRole)


    /**
     * CFN Virgin Init λ Function
     * This λ function creates necessary resources for a virgin account/region
    */
    const kbCustomResourceFn = new NodejsFunction(this, `${props.prefix}-${props.account}-kb-custom-resource-fn-${props.stage}`, {
      functionName: `${props.prefix}-${props.account}-kb-custom-resource-fn-${props.stage}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: Duration.seconds(900),
      memorySize: 512,
      handler: 'handler',
      role: kbCustomResourceRole,
      entry: path.join(__dirname, '/../functions/ts/request.ts'),
    });

    const kbProvider = new Provider(this, `${props.prefix}-${props.account}-kb-provider-${props.stage}`, {
      onEventHandler: kbCustomResourceFn,
      logRetention: RetentionDays.ONE_WEEK,
    })

    /**
     * CFN Init
     */
    const kb = new CustomResource( this, `${props.prefix}-${props.account}-kb-custom-resource-${props.stage}`, {
      serviceToken: kbProvider.serviceToken,
      properties: {
        knowledgeBaseBucketArn: kbBucket.bucketArn,
        knowledgeBaseRoleArn: kbRole.roleArn,
        knowledgeBaseCustomResourceRole: kbCustomResourceRole.roleArn,
        accessPolicyArns: JSON.stringify([]),
        prefix: props.prefix,
        knowledgeBaseEmbeddingModelArn: 'arn:aws:bedrock:us-west-2::foundation-model/amazon.titan-embed-text-v1',
      }
    })

    this.knowledgeBaseArn = kb.getAttString('knowledgeBaseArn')
    this.knowledgeBaseId = kb.getAttString('knowledgeBaseId')
    this.collectionArn = kb.getAttString('collectionArn')
    this.collectionId = kb.getAttString('collectionId')
    this.collectionName = kb.getAttString('collectionName')
    this.collectionEndpoint = kb.getAttString('collectionEndpoint')
    this.dataSourceId = kb.getAttString('dataSourceId')

  } // End constructor
}