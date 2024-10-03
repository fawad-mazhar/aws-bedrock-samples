import { defaultProvider } from '@aws-sdk/credential-provider-node'
import { Client } from '@opensearch-project/opensearch'
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws'

const AWS_REGION = process.env.AWS_REGION

interface CreateIndexParams {
  host: string;
  prefix: string;
}
export const createIndex = async (params: CreateIndexParams) => {
  const { host, prefix } = params
  console.log('Creating OS Index...');
  await new Promise((resolve) => setTimeout(resolve, 60000));

  const client = new Client({
    ...AwsSigv4Signer({
      region: AWS_REGION!,
      service: 'aoss',
      getCredentials: () => {
        const credentialsProvider = defaultProvider()
        return credentialsProvider()
      },
    }),
    node: host,
  })

  console.log(JSON.stringify(client))
  try {
    var createIndexResponse = await client.indices.create({
      index: `${prefix}`,
      body: {
        settings: {
          'index.knn': true,
        },
        mappings: {
          properties: {
            [`${prefix}-vector`]: {
              type: 'knn_vector',
              dimension: 1536,
              method: {
                name: 'hnsw',
                engine: 'faiss',
                parameters: {
                  ef_construction: 512,
                  m: 16,
                },
              },
            },
          },
        },
      },
    })

    console.log(JSON.stringify(createIndexResponse.body, null, 2));
  } catch (error) {
    console.error(JSON.stringify(error, null, 2));
  }
};
