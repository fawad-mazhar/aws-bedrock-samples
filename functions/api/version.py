#!/usr/bin/python
import os

def main(event):

  return {
    'service': 'aws-bedrock-samples',
    'version': '1.0.0',
    'stage': os.environ['STAGE']
  }