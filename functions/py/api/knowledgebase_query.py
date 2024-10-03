#!/usr/bin/python
import os
import boto3
import json
from botocore.exceptions import ClientError

def main(event):
    body  = json.loads(event['body']) 
    prompt = body['prompt']
    print(f"prompt: {prompt}")
    
    client = boto3.client('bedrock-agent-runtime')
    retrieveAndGenerateInput = {
        "input": {
            "text": prompt,
        },
        "retrieveAndGenerateConfiguration": {
            "type": "KNOWLEDGE_BASE",
            "knowledgeBaseConfiguration": {
                "knowledgeBaseId": os.environ['KNOWLEDGE_BASE_ID'],
                "modelArn": os.environ["KNOWLEDGE_BASE_MODEL_ARN"],
            },
        },
    }
    if "session_id" in body:
        retrieveAndGenerateInput["sessionId"] = body["session_id"]

    try:
        response = client.retrieve_and_generate(**retrieveAndGenerateInput)
        return {
            "body": response
        }
    except ClientError as e:
        print(e)
        raise
