#!/usr/bin/env python3
import os
from dotenv import load_dotenv

from aws_cdk import App, Environment

from stacks.api_stack import ApiStack
from stacks.credential_sharing_stack import CredentialSharingStack

load_dotenv()

app = App()

# Define the AWS environments
env = Environment(
    account=os.environ.get("CDK_DEFAULT_ACCOUNT"),
    region=os.environ.get("CDK_DEFAULT_REGION", "us-east-1"),
)

env_name = os.environ.get("ENV", "production")

# 1. API Gateway Stack (Production only)
api_stack = ApiStack(
    app,
    "InternalTools-ApiStack",
    resource_suffix="",
    env=env
)

# 2. Credential Sharing Stack (S3 bucket with 24-hour auto-delete)
credential_sharing_stack = CredentialSharingStack(
    app,
    "InternalTools-CredentialSharingStack",
    resource_suffix="",
    env=env
)

app.synth()