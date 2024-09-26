#!/usr/bin/python
'''
  This is a generic handler function for API Gateway Lambdas.
'''

import json
from api.version import main as get_version
from api.generate_image import main as generate_image

# Common entry point for all lambda functions
def handler(event, context):
    event = json.loads( json.dumps(event) )
    is_proxy_request = False
    error = None
    response = None

    try:
        if 'httpMethod' in event and 'resource' in event:
            is_proxy_request = True
            proxy_request = event['httpMethod'] + ':' + event['resource']
            print('[REQUEST] {}'.format(proxy_request))
            if proxy_request == 'GET:/':
                response = get_version(event)
            elif proxy_request == 'POST:/generate-image':
                response = generate_image(event)
            else:
                error = '[404] Route Not Found'
        else:
            print('[UNKNOWN]', json.dumps(event))
            response = {}
    except Exception as e:
        raise(e)

    if is_proxy_request and error:
        # Proxy Error
        err_response = construct_proxy_error(error)
        return err_response

    if is_proxy_request:
        # Proxy Success
        response = construct_proxy_success(response)
        return response

    if error:
        # Raw Error
        return error

    # Raw Success
    return response


def construct_proxy_success(response_obj):
    response = {
        'statusCode': 200,
        'body': json.dumps(response_obj),
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': True,
        },
    }
    return response

def construct_proxy_error(err):
    message = None
    code = None

    if 'message' in err:
        message = err['message']
    if 'code' in err:
        code = err['code']

    response = {
        'statusCode': 500,
        'body': json.dumps({ 'errorMessage': message, 'errorCode': code }),
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': True,
        },
    }
    return response
