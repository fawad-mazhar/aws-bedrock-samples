import { Aws, Duration, RemovalPolicy, Stack, StackProps, aws_s3objectlambda, CfnOutput} from 'aws-cdk-lib'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'
import { Effect, ManagedPolicy, PolicyStatement, Role, ServicePrincipal, ArnPrincipal, Policy, User, AnyPrincipal } from 'aws-cdk-lib/aws-iam'
import { RestApi, LambdaIntegration, Cors, AuthorizationType} from 'aws-cdk-lib/aws-apigateway'
import { Construct } from 'constructs'
import * as path from 'path'

interface BedrockSamplesStackProps extends StackProps {
  stage: string
  prefix: string
}


export class BedrockSamplesStack extends Stack {
  constructor(scope: Construct, id: string, props: BedrockSamplesStackProps) {
    super(scope, id, props);


    const assetsBucket = new s3.Bucket(this, `${props.prefix}-${this.account}-assets-${props.stage}`, {
      bucketName: `${props.prefix}-${this.account}-assets-${props.stage}`,
      cors: [{
        allowedMethods: [s3.HttpMethods.POST],
        allowedOrigins: ["*"],
        allowedHeaders: ["*"]
      }],
      removalPolicy: RemovalPolicy.DESTROY,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      autoDeleteObjects: true,
      lifecycleRules: [{
        enabled: true,
        expiration: Duration.days(1)
      }],
    })
    
    new CfnOutput(this, `${props.prefix}-${this.account}-assets-${props.stage}-output`, {
      description: "S3 bucket that stable difussion assets.",
      value: `${props.prefix}-${this.account}-assets-${props.stage}`,      
    })


    /**
     * API GW Defintion
     */
    const restApi = new RestApi(this, `${props.prefix}-bedrock-api-${props.stage}`, {
      restApiName: `${props.prefix}-bedrock-api-${props.stage}`,
      description: 'Sample Bedrock Http Api',
      deployOptions: {
        stageName: props.stage,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
          'X-Auth-Token',
          'Cognito-Refresh-Token',
          'User-Agent',
        ],
        allowMethods: ['OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowCredentials: true
      }
    })

    /**
     * API GW λ Function
     * This λ Function is used to ....
     */
    new LogGroup(this, `${props.prefix}-bedrock-request-log-grp-${props.stage}`, {
      logGroupName: `/aws/lambda/${props.prefix}-bedrock-request-${props.stage}`,
      retention: RetentionDays.ONE_YEAR,
      removalPolicy: RemovalPolicy.DESTROY,
    })
    const httpRequestLambdaFn = new lambda.Function(this, `${props.prefix}-bedrock-request-${props.stage}`, {
      functionName: `${props.prefix}-bedrock-request-${props.stage}`,
      runtime: lambda.Runtime.PYTHON_3_10,
      timeout: Duration.seconds(29),
      memorySize: 2048,
      handler: 'main.handler',
      environment: {
        STAGE: props.stage,
        API_URL: `https://${restApi.restApiId!}.execute-api.us-west-2.amazonaws.com/${props.stage}/`,
        ASSETS_BUCKET: assetsBucket.bucketName,
      },
      code: lambda.Code.fromAsset(path.join(__dirname, '/../functions'), {
        bundling: {
          image: lambda.Runtime.PYTHON_3_10.bundlingImage,
          command: [
            'bash',
            '-c',
            'pip install -r requirements.txt -t /asset-output && cp -au . /asset-output',
          ],
        },
      }),
    })
    httpRequestLambdaFn.addToRolePolicy(new PolicyStatement({
      actions: [
        's3:GetObject',
        's3:PutObject',
        's3:HeadObject',
        's3:DeleteObject'
      ],
      resources: [
        `${assetsBucket.bucketArn}/*`,
      ]
    }))
    httpRequestLambdaFn.addToRolePolicy(new PolicyStatement({
      actions: [
        's3:ListBucket'
      ],
      resources: [
        `${assetsBucket.bucketArn}`,
      ]
    }))
    httpRequestLambdaFn.addToRolePolicy(new PolicyStatement({
      actions: [
        'bedrock:Invoke*'
      ],
      resources: ['*']
    }))

    
    /**
     * API GW Methods and Routes
     */
    restApi.root.addMethod('GET', new LambdaIntegration(httpRequestLambdaFn), {
      authorizationType: AuthorizationType.NONE
    })
    const imageApi = restApi.root.addResource('generate-image')
    imageApi.addMethod('POST', new LambdaIntegration(httpRequestLambdaFn))



  } // end constructor
}
