#!/usr/bin/python
# Using Titan Image Generator G1
# This generates realistic images from natural language.

import json
import boto3
import base64
import ulid
import os
from botocore.exceptions import ClientError


def main(event):
    body  = json.loads(event['body']) 
    prompt = body['prompt']
    print(f"Prompt: {prompt}")

    bedrock_client = boto3.client("bedrock-runtime")

    # Set the model ID to Titan Image Generator G1.
    model_id = "amazon.titan-image-generator-v1"

    # Format the request payload using the model's native structure.
    request = json.dumps({ 
       "textToImageParams": {
            "text": prompt
        },
       "taskType": "TEXT_IMAGE",
       "imageGenerationConfig": {
            "cfgScale": 8,
            "seed": 0,
            "width": 1024,
            "height": 1024,
            "numberOfImages": 1
        }
    })   
    
    # Invoke the model with the request.
    print(f'Requesting: {request}')
    try:
       response = bedrock_client.invoke_model(modelId=model_id, body=request)
    except ClientError as e:
        print(e)
        raise

    # Decode the response body.
    model_response = json.loads(response["body"].read())

    # Extract the image data.
    base64_image_data = model_response["images"][0]
    image_data = base64.b64decode(base64_image_data)

    
    print('Image generated, writing to S3...')
    s3_bucket = os.environ['ASSETS_BUCKET'] 
    s3_key_name = ulid.ulid() + '.png'
    try:
        boto3.client('s3').put_object(
            Bucket=s3_bucket,
            Body=image_data,
            Key=s3_key_name
        )
    except ClientError as e:
        print(e)
        raise
    
    signed_url = boto3.client('s3').generate_presigned_url(
       'get_object', 
       Params={
           'Bucket': s3_bucket,
           'Key': s3_key_name
        }, 
        ExpiresIn=3600
    )
    
    print('Done!')
    return {
        'body': signed_url
    }

