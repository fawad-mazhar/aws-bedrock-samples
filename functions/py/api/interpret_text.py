#!/usr/bin/python
# Using Cohere for text interpretation.

import boto3
import json
from botocore.exceptions import ClientError

def main(event):
    body  = json.loads(event['body']) 
    prompt = body['prompt']
    print(f"Prompt: {prompt}")

    client = boto3.client("bedrock-runtime")

    model_id = "cohere.command-r-plus-v1:0"

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
            inferenceConfig={"temperature":0.3,"topP":0.75},
            additionalModelRequestFields={"k":0}
        )

        # Extract and print the response text.
        response_text = response["output"]["message"]["content"][0]["text"]
        return {
            "body": response_text 
        }

    except (ClientError, Exception) as e:
        print(f"ERROR: Can't invoke '{model_id}'. Reason: {e}")
        raise


