#!/usr/bin/python
# Using Claude 3 Sonnet for summarizing text.

import boto3
import json
from botocore.exceptions import ClientError

def main(event):
    body  = json.loads(event['body']) 
    prompt = body['prompt']
    print(f"Prompt: {prompt}")

    client = boto3.client("bedrock-runtime")

    model_id = "anthropic.claude-3-sonnet-20240229-v1:0"
    
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
            inferenceConfig={"maxTokens": 4096, "temperature": 0},
            additionalModelRequestFields={"top_k": 250}
        )

        # Extract and print the response text.
        response_text = response["output"]["message"]["content"][0]["text"]
        return {
            'body': response_text
        }

    except (ClientError, Exception) as e:
        print(f"ERROR: Can't invoke '{model_id}'. Reason: {e}")
        raise
