import { randomUUID } from 'crypto'
import { BedrockAgentClient, CreateKnowledgeBaseCommand, CreateDataSourceCommand, CreateKnowledgeBaseCommandOutput, DeleteKnowledgeBaseCommand } from '@aws-sdk/client-bedrock-agent';
import * as ssm from './ssm'

const AWS_REGION = process.env.AWS_REGION;
const bedrockAgentClient = new BedrockAgentClient({ region: AWS_REGION });

interface CreateKnowledgeBaseProps {
  knowledgeBaseRoleArn: string;
  prefix: string,
  knowledgeBaseEmbeddingModelArn: string;
  collectionArn: string;
}

export const createKnowledgeBase = async (params: CreateKnowledgeBaseProps): Promise<CreateKnowledgeBaseCommandOutput> => {
  console.log('Creating KnowledgeBase');
  const { knowledgeBaseRoleArn, prefix, knowledgeBaseEmbeddingModelArn, collectionArn } = params;
  await new Promise((resolve) => setTimeout(resolve, 60000));
  try {
    const data = await bedrockAgentClient.send(
      new CreateKnowledgeBaseCommand({
        clientToken: randomUUID(),
        name: `${prefix}`,
        roleArn: knowledgeBaseRoleArn,
        knowledgeBaseConfiguration: {
          type: 'VECTOR',
          vectorKnowledgeBaseConfiguration: {
            embeddingModelArn: knowledgeBaseEmbeddingModelArn,
          },
        },
        storageConfiguration: {
          type: 'OPENSEARCH_SERVERLESS',
          opensearchServerlessConfiguration: {
            collectionArn: collectionArn,
            vectorIndexName: `${prefix}`,
            fieldMapping: {
              vectorField: `${prefix}-vector`,
              textField: 'text',
              metadataField: 'metadata',
            },
          },
        },
      }),
    );
    if ( data && data.knowledgeBase && data.knowledgeBase.knowledgeBaseId && data.knowledgeBase.knowledgeBaseArn ) {
      console.log('KnowledgeBase created');
      await ssm.storeParameters({
        name: `/${prefix}/knowledgeBaseId`,
        value: data.knowledgeBase.knowledgeBaseId,
      });
      await ssm.storeParameters({
        name: `/${prefix}/knowledgeBaseArn`,
        value: data.knowledgeBase.knowledgeBaseArn,
      });
      return data;
    } else {
      throw new Error('Failed to create Knowledge Base');
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
    }
    throw new Error('Failed to create Knowledge Base');
  }
};

interface CreateDataSourceProps {
  knowledgeBaseBucketArn: string;
  knowledgeBaseId: string;
  prefix: string;
}

export const createDataSource = async (params: CreateDataSourceProps) => {
  console.log('Creating DataSource');
  const { knowledgeBaseBucketArn, knowledgeBaseId, prefix } =
    params;
  try {
    const dataSourceCreateResponse = await bedrockAgentClient.send(
      new CreateDataSourceCommand({
        knowledgeBaseId: knowledgeBaseId,
        clientToken: randomUUID(),
        name: `${prefix}`,
        dataSourceConfiguration: {
          type: 'S3',
          s3Configuration: {
            bucketArn: knowledgeBaseBucketArn,
            inclusionPrefixes: ['knowledgeBase/'],
          },
        },
      }),
    )
    if ( dataSourceCreateResponse && dataSourceCreateResponse.dataSource && dataSourceCreateResponse.dataSource.dataSourceId ) {
      console.log('DataSource created');
      await ssm.storeParameters({
        name: `/${prefix}/dataSourceId`,
        value: dataSourceCreateResponse.dataSource.dataSourceId,
      });
      return dataSourceCreateResponse;
    } else {
      throw new Error('Failed to create data source')
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
    }
    throw new Error('Failed to create data source')
  }
};

interface DeleteKnowledgeBaseParams {
  prefix: string;
}

export const deleteKnowledgeBase = async (
  params: DeleteKnowledgeBaseParams,
) => {
  const { prefix } = params;
  try {
    const knowledgeBaseId = await ssm.retrieveParameters({
      name: `/${prefix}/knowledgeBaseId`,
    });
    await bedrockAgentClient.send(
      new DeleteKnowledgeBaseCommand({
        knowledgeBaseId: knowledgeBaseId,
      }),
    );
  } catch (error) {
    console.error('Error deleting knowledge bases:', error)
    throw error;
  }
};

interface UpdateKnowledgeBaseParams {
  prefix: string;
}

export const updateKnowledgeBase = async (
  params: UpdateKnowledgeBaseParams,
) => {
  const { prefix } = params;

  try {
    const knowledgeBaseId = await ssm.retrieveParameters({
      name: `/${prefix}/knowledgeBaseId`,
    });
    const knowledgeBaseArn = await ssm.retrieveParameters({
      name: `/${prefix}/knowledgeBaseArn`,
    });

    const dataSourceId = await ssm.retrieveParameters({
      name: `/${prefix}/dataSourceId`,
    });
    return { knowledgeBaseId, knowledgeBaseArn, dataSourceId }
  } catch (error) {
    console.error('Error updating knowledge bases:', error)
    throw error;
  }
};
