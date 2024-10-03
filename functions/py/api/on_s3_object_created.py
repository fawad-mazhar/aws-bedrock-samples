#!/usr/bin/python
# Using Titan Image Generator G1, this generates realistic images from natural language.

import json
import boto3
import os
from botocore.exceptions import ClientError

def main(event):
    print(event)
    client = boto3.client('bedrock-agent')
    try:
        response = client.start_ingestion_job(
            dataSourceId=os.environ['DATA_SOURCE_ID'],
            knowledgeBaseId=os.environ['KNOWLEDGE_BASE_ID']
        )
        return response
    except ClientError as e:
        print(e)
        raise

