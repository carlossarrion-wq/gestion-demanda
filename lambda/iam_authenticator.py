"""
IAM Authenticator Lambda Function
Authenticates users with AWS IAM credentials and returns temporary session tokens
Includes team extraction from IAM user tags
"""

import json
import boto3
import os
import re
from botocore.exceptions import ClientError

# Team keyword mapping
# IMPORTANT: Order matters! Check more specific keywords first (saplcorp before sap)
TEAM_KEYWORDS = {
    'darwin': ['darwin'],
    'mulesoft': ['mulesoft', 'mule soft', 'mule-soft'],
    'saplcorp': ['saplcorp', 'sapl corp', 'sapl-corp'],
    'sap': ['sap']
}

def extract_team_keyword(team_tag):
    """
    Extract normalized team keyword from team tag
    
    Args:
        team_tag: Team tag value (e.g., "Equipo Darwin", "DeltaSmile Team")
    
    Returns:
        Normalized team keyword (e.g., "darwin", "deltasmile") or None
    """
    if not team_tag:
        return None
    
    team_lower = team_tag.lower()
    
    # Check each team keyword
    for keyword, variations in TEAM_KEYWORDS.items():
        for variation in variations:
            if variation in team_lower:
                return keyword
    
    return None

def get_user_info_from_tags(username):
    """
    Get team, email, and full name from IAM user tags
    
    Args:
        username: IAM username
    
    Returns:
        dict with team_keyword, team_full, email, and full_name, or None if not found
    """
    try:
        iam_client = boto3.client('iam')
        
        # Get user tags
        response = iam_client.list_user_tags(UserName=username)
        tags = response.get('Tags', [])
        
        # Find Team, Email, and Person tags
        team_tag = next((tag['Value'] for tag in tags if tag['Key'] == 'Team'), None)
        email_tag = next((tag['Value'] for tag in tags if tag['Key'] == 'Email'), None)
        person_tag = next((tag['Value'] for tag in tags if tag['Key'] == 'Person'), None)
        
        result = {
            'team_keyword': None,
            'team_full': None,
            'email': email_tag,
            'full_name': person_tag
        }
        
        if team_tag:
            team_keyword = extract_team_keyword(team_tag)
            result['team_keyword'] = team_keyword
            result['team_full'] = team_tag
        
        return result
        
    except ClientError as e:
        print(f"Error getting user tags: {str(e)}")
        return None

def lambda_handler(event, context):
    """
    Authenticate IAM user and return temporary credentials with team information
    
    Expected input:
    {
        "access_key": "AWS_ACCESS_KEY_ID",
        "secret_key": "AWS_SECRET_ACCESS_KEY"
    }
    
    Returns temporary AWS credentials (AccessKeyId, SecretAccessKey, SessionToken) and team info
    """
    
    # Enable CORS
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    }
    
    # Handle preflight OPTIONS request
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'message': 'CORS preflight'})
        }
    
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        access_key = body.get('access_key', '').strip()
        secret_key = body.get('secret_key', '').strip()
        
        # Validate input
        if not access_key or not secret_key:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'error': 'Missing credentials',
                    'message': 'Both access_key and secret_key are required'
                })
            }
        
        try:
            # Create STS client with the provided credentials to validate them
            sts_client = boto3.client(
                'sts',
                aws_access_key_id=access_key,
                aws_secret_access_key=secret_key
            )
            
            # Validate credentials by calling GetCallerIdentity
            identity = sts_client.get_caller_identity()
            
            # Extract username from ARN
            # ARN format: arn:aws:iam::123456789012:user/username
            arn = identity['Arn']
            username = arn.split('/')[-1] if '/' in arn else arn.split(':')[-1]
            
            print(f"User authenticated: {username} (ARN: {arn})")
            
            # Get user info from IAM tags using the Lambda's role
            # (Lambda needs iam:ListUserTags permission)
            user_tags_info = get_user_info_from_tags(username)
            
            # Build user info
            user_info = {
                'username': username,
                'account': identity['Account'],
                'arn': arn,
                'user_id': identity['UserId']
            }
            
            # Add team information if available
            if user_tags_info:
                if user_tags_info['team_keyword']:
                    user_info['team'] = user_tags_info['team_keyword']
                    user_info['team_full'] = user_tags_info['team_full']
                    print(f"User {username} has team: {user_tags_info['team_keyword']}")
                else:
                    user_info['team'] = None
                    user_info['team_full'] = None
                    print(f"Warning: User {username} has no Team tag")
                
                # Add email - use Email tag if available, otherwise use username as fallback
                if user_tags_info['email']:
                    user_info['email'] = user_tags_info['email']
                    print(f"User {username} has email from tag: {user_tags_info['email']}")
                else:
                    # Use username as email fallback (many IAM usernames are email addresses)
                    user_info['email'] = username
                    print(f"User {username} using username as email: {username}")
                
                # Add full name from person tag if available
                if user_tags_info['full_name']:
                    user_info['full_name'] = user_tags_info['full_name']
                    print(f"User {username} has full name: {user_tags_info['full_name']}")
                else:
                    user_info['full_name'] = None
                    print(f"Warning: User {username} has no person tag")
            else:
                user_info['team'] = None
                user_info['team_full'] = None
                user_info['email'] = username  # Use username as email fallback
                user_info['full_name'] = None
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'success': True,
                    'message': 'Authentication successful',
                    'user': user_info
                })
            }
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'error': 'Authentication failed',
                    'message': f'AWS Error: {error_code} - {error_message}'
                })
            }
    
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'error': 'Invalid request',
                'message': 'Request body must be valid JSON'
            })
        }
    
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'error': 'Internal server error',
                'message': str(e)
            })
        }


# For local testing
if __name__ == '__main__':
    # Test event
    test_event = {
        'httpMethod': 'POST',
        'body': json.dumps({
            'access_key': 'test-access-key',
            'secret_key': 'test-secret-key'
        })
    }
    
    result = lambda_handler(test_event, None)
    print(json.dumps(json.loads(result['body']), indent=2))
