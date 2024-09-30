import { randomUUID } from 'crypto'
import { OpenSearchServerlessClient,
  BatchGetCollectionCommand,
  CreateSecurityPolicyCommand,
  CreateAccessPolicyCommand,
  CreateCollectionCommand,
  CollectionDetail,
  DeleteAccessPolicyCommand,
  DeleteSecurityPolicyCommand,
  DeleteCollectionCommand,
} from '@aws-sdk/client-opensearchserverless'
import * as ssm from './ssm'

const AWS_REGION = process.env.AWS_REGION

const openSearchServerlessClient = new OpenSearchServerlessClient({
  region: AWS_REGION,
})

interface CreateEncryptionSecurityPolicyParams {
  prefix: string;
}

export const createEncryptionSecurityPolicy = async (
  params: CreateEncryptionSecurityPolicyParams,
) => {
  console.log('Creating Encryption SecurityPolicy');
  const { prefix } = params;
  try {
    const data = await openSearchServerlessClient.send(
      new CreateSecurityPolicyCommand({
        clientToken: randomUUID(),
        name: `${prefix}`,
        type: 'encryption',
        policy: JSON.stringify({
          Rules: [
            {
              ResourceType: 'collection',
              Resource: [`collection/${prefix}`],
            },
          ],
          AWSOwnedKey: true,
        }),
      }),
    );
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
    }
    throw new Error('Failed to create Encryption SecurityPolicy');
  }
};

interface CreateNetworkSecurityPolicyParams {
  prefix: string
}

export const createNetworkSecurityPolicy = async (
  params: CreateNetworkSecurityPolicyParams,
) => {
  console.log('Creating Network SecurityPolicy')
  const { prefix } = params;
  try {
    const policy = [
      {
        AllowFromPublic: true,
        Rules: [
          {
            ResourceType: 'dashboard',
            Resource: [`collection/${prefix}`],
          },
          {
            ResourceType: 'collection',
            Resource: [`collection/${prefix}`],
          },
        ],
      },
    ];
    const data = await openSearchServerlessClient.send(
      new CreateSecurityPolicyCommand({
        clientToken: randomUUID(),
        name: `${prefix}`,
        type: 'network',
        policy: JSON.stringify(policy),
      }),
    )
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
    }
    throw new Error('Failed to create SecurityPolicy');
  }
};

interface CreateAccessPolicyParams {
  prefix: string;
  knowledgeBaseRoleArn: string;
  knowledgeBaseCustomResourceRole: string;
  accessPolicyArns: string;
}

export const createAccessPolicy = async (params: CreateAccessPolicyParams) => {
  console.log('Creating AccessPolicy')
  const { prefix, knowledgeBaseRoleArn, knowledgeBaseCustomResourceRole, accessPolicyArns } = params

  const parsedArns: string[] = JSON.parse(accessPolicyArns)
  const principalArray = [
    ...parsedArns,
    knowledgeBaseRoleArn,
    knowledgeBaseCustomResourceRole,
  ]

  const policy = [{
    Rules: [
      {
        Resource: [`collection/${prefix}`],
        Permission: [
          'aoss:DescribeCollectionItems',
          'aoss:CreateCollectionItems',
          'aoss:UpdateCollectionItems',
        ],
        ResourceType: 'collection',
      },
      {
        Resource: [`index/${prefix}/*`],
        Permission: [
          'aoss:UpdateIndex',
          'aoss:DescribeIndex',
          'aoss:ReadDocument',
          'aoss:WriteDocument',
          'aoss:CreateIndex',
        ],
        ResourceType: 'index',
      },
    ],
    Principal: principalArray,
    Description: '',
  }];

  console.log(`Access Policy: ${JSON.stringify(policy, null, 2)}`)
  try {
    const data = await openSearchServerlessClient.send(
      new CreateAccessPolicyCommand({
        clientToken: randomUUID(),
        name: `${prefix}`,
        type: 'data',
        policy: JSON.stringify(policy),
      }),
    )
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
    }
  }
  throw new Error('Failed to create AccessPolicy');
};

interface CreateCollectionParams {
  prefix: string;
}

export const createCollection = async ( params: CreateCollectionParams ): Promise<CollectionDetail> => {
  const { prefix } = params
  console.log('Creating Collection');
  try {
    const createCollectionResponse = await openSearchServerlessClient.send(
      new CreateCollectionCommand({
        clientToken: randomUUID(),
        type: 'VECTORSEARCH',
        name: `${prefix}`,
      }),
    );
    const collectionId = createCollectionResponse.createCollectionDetail?.id!

    const maxAttempts = 30;
    let attempts = 0;

    while (attempts < maxAttempts) {
      console.log(`Checking Collection Status Attempt: ${attempts}`)
      const batchGetCollectionResponse = await openSearchServerlessClient.send(
        new BatchGetCollectionCommand({
          ids: [collectionId],
        }),
      );

      const collections = batchGetCollectionResponse.collectionDetails

      if (collections && collections.length > 0) {
        const collection = collections[0];
        console.log(`Collection Status: ${collection.status}`);
        if (collection.status === 'ACTIVE') {
          await ssm.storeParameters({
            name: `/${prefix}/collectionId`,
            value: collection.id!,
          });
          await ssm.storeParameters({
            name: `/${prefix}/collectionArn`,
            value: collection.arn!,
          });
          await ssm.storeParameters({
            name: `/${prefix}/collectionName`,
            value: collection.name!,
          });

          await ssm.storeParameters({
            name: `/${prefix}/collectionEndpoint`,
            value: collection.collectionEndpoint!,
          });
          return collection;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 30000));
      attempts++
    }

    throw new Error('Failed to create collection: Timeout exceeded');
  } catch (error) {
    if (error instanceof Error) {
      console.error(error)
    }
    console.error('Failed to create collection:', error)
    throw error;
  }
};

interface DeleteAccessPolicyParams {
  prefix: string;
}

export const deleteAccessPolicy = async (params: DeleteAccessPolicyParams) => {
  console.log('Deleting AccessPolicy')
  const { prefix } = params;
  try {
    await openSearchServerlessClient.send(
      new DeleteAccessPolicyCommand({
        name: `${prefix}`,
        type: 'data',
      }),
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
    }
    return
  }
}

interface DeleteSecurityPolicyParams {
  prefix: string;
  type: 'encryption' | 'network';
}

export const deleteSecurityPolicy = async (
  params: DeleteSecurityPolicyParams,
) => {
  console.log('Deleting AccessPolicy');
  const { prefix, type } = params;
  try {
    await openSearchServerlessClient.send(
      new DeleteSecurityPolicyCommand({
        name: `${prefix}`,
        type: type,
      }),
    )
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
    }
    return
  }
};

interface DeleteCollectionParams {
  prefix: string;
}

export const deleteCollection = async (params: DeleteCollectionParams) => {
  console.log('Deleting Collection');
  const { prefix } = params;

  const collectionId = await ssm.retrieveParameters({
    name: `/${prefix}/collectionId`,
  })

  try {
    await openSearchServerlessClient.send(
      new DeleteCollectionCommand({
        id: collectionId,
      }),
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
    }
    throw new Error('Failed to delete Collection');
  }
}

interface updateCollectionParams {
  prefix: string
}

export const updateCollection = async (params: updateCollectionParams) => {
  console.log('Updating Collection');
  const { prefix } = params
  try {
    const collectionId = await ssm.retrieveParameters({
      name: `/${prefix}/collectionId`,
    });

    const collectionName = await ssm.retrieveParameters({
      name: `/${prefix}/collectionName`,
    });

    const collectionArn = await ssm.retrieveParameters({
      name: `/${prefix}/collectionArn`,
    });

    const collectionEndpoint = await ssm.retrieveParameters({
      name: `/${prefix}/collectionEndpoint`,
    });

    return { collectionId, collectionName, collectionEndpoint, collectionArn };
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
    }
    throw new Error('Failed to update Collection');
  }
};
