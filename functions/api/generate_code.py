#!/usr/bin/python
# Using Llama 2 Chat 70B for Code generation.

import boto3
import json
from botocore.exceptions import ClientError

def main(event):
    body  = json.loads(event['body']) 
    prompt = body['prompt']
    print(f"Prompt: {prompt}")

    client = boto3.client("bedrock-runtime", region_name="us-west-2")

    model_id = "meta.llama2-70b-chat-v1"

    conversation = [
        {
            "role": "user",
            "content": [{"text": prompt}],
        }
    ]

    try:
        # Send the message to the model, using a basic inference configuration.
        response = client.converse(
            modelId=model_id,
            messages=conversation,
            inferenceConfig={"maxTokens":512,"temperature":0.5,"topP":0.9},
            additionalModelRequestFields={}
        )

        # Extract and print the response text.
        response_text = response["output"]["message"]["content"][0]["text"]
        return {
            "body": response_text 
        }

    except (ClientError, Exception) as e:
        print(f"ERROR: Can't invoke '{model_id}'. Reason: {e}")
        raise
