import { CdkCustomResourceEvent, CdkCustomResourceResponse, Context } from 'aws-lambda'
import * as br from './bedrock'
import * as ssm from './ssm'
import { createIndex } from './openSearch'
import * as oss from './openSearchServerless'

let response: CdkCustomResourceResponse = {};

export const handler = async (event: CdkCustomResourceEvent, context: Context): Promise<CdkCustomResourceResponse> => {
  console.info('event: ', event)

  const requestType = event.RequestType
  const requestProperties = event.ResourceProperties

  switch (requestType) {
    case 'Create':
      console.log('Create');
      await oss.createAccessPolicy({
        prefix: requestProperties.prefix,
        knowledgeBaseRoleArn: requestProperties.knowledgeBaseRoleArn,
        knowledgeBaseCustomResourceRole:
          requestProperties.knowledgeBaseCustomResourceRole,
        accessPolicyArns: requestProperties.accessPolicyArns,
      })
      await oss.createNetworkSecurityPolicy({
        prefix: requestProperties.prefix,
      })
      await oss.createEncryptionSecurityPolicy({
        prefix: requestProperties.prefix,
      })
      const collection = await oss.createCollection({
        prefix: requestProperties.prefix,
      });
      await createIndex({
        host: collection.collectionEndpoint!,
        prefix: requestProperties.prefix,
      });
      const knowledgeBase = await br.createKnowledgeBase({
        knowledgeBaseRoleArn: requestProperties.knowledgeBaseRoleArn,
        prefix: requestProperties.prefix,
        knowledgeBaseEmbeddingModelArn: requestProperties.knowledgeBaseEmbeddingModelArn,
        collectionArn: collection.arn!,
      });
      const dataSource = await br.createDataSource({
        knowledgeBaseBucketArn: requestProperties.knowledgeBaseBucketArn,
        knowledgeBaseId: knowledgeBase.knowledgeBase?.knowledgeBaseId!,
        prefix: requestProperties.prefix,
      });

      response.Data = {
        collectionArn: collection.arn!,
        collectionId: collection.id!,
        collectionName: collection.name!,
        collectionEndpoint: collection.collectionEndpoint,
        dataSourceId: dataSource?.dataSource?.dataSourceId,
        knowledgeBaseId: knowledgeBase.knowledgeBase?.knowledgeBaseId,
      };
      response.Status = 'SUCCESS';
      response.Reason = 'CreateKnowledgeBase successful';

      break
    case 'Update':
      console.log('Update KnowledgeBase - NOOP');
      const collectionInfo = await oss.updateCollection({
        prefix: requestProperties.prefix,
      })
      const knowledgeBaseInfo = await br.updateKnowledgeBase({
        prefix: requestProperties.prefix,
      })
      response.Data = {
        collectionArn: collectionInfo.collectionArn,
        collectionId: collectionInfo.collectionId,
        collectionName: collectionInfo.collectionName,
        collectionEndpoint: collectionInfo.collectionEndpoint,
        dataSourceId: knowledgeBaseInfo.dataSourceId,
        knowledgeBaseId: knowledgeBaseInfo.knowledgeBaseId,
      };
      response.Status = 'SUCCESS';
      response.Reason = 'UpdateKnowledgeBase successful';
      break
    case 'Delete':
      console.log('Delete KnowledgeBase');
      await oss.deleteAccessPolicy({
        prefix: requestProperties.prefix,
      })
      await oss.deleteSecurityPolicy({
        prefix: requestProperties.prefix,
        type: 'network',
      })
      await oss.deleteSecurityPolicy({
        prefix: requestProperties.prefix,
        type: 'encryption',
      })
      await oss.deleteCollection({
        prefix: requestProperties.prefix,
      })
      await br.deleteKnowledgeBase({
        prefix: requestProperties.prefix,
      })
      await ssm.deleteParameter({
        name: `/${requestProperties.prefix}/collectionArn`,
      })
      await ssm.deleteParameter({
        name: `/${requestProperties.prefix}/collectionEndpoint`,
      });
      await ssm.deleteParameter({
        name: `/${requestProperties.prefix}/collectionId`,
      });
      await ssm.deleteParameter({
        name: `/${requestProperties.prefix}/collectionName`,
      });
      await ssm.deleteParameter({
        name: `/${requestProperties.prefix}/dataSourceId`,
      });
      await ssm.deleteParameter({
        name: `/${requestProperties.prefix}/knowledgeBaseArn`,
      });
      await ssm.deleteParameter({
        name: `/${requestProperties.prefix}/knowledgeBaseId`,
      });

      response.Status = 'SUCCESS';
      response.Reason = 'DeleteKnowledgeBase successful';
      break;
  }

  response.StackId = event.StackId;
  response.RequestId = event.RequestId;
  response.LogicalResourceId = event.LogicalResourceId;
  response.PhysicalResourceId = context.logGroupName;

  console.log(`Response: ${JSON.stringify(response)}`);

  return response
}