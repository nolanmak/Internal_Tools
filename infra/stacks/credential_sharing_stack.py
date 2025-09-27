from aws_cdk import (
    Stack,
    aws_s3 as s3,
    aws_s3_notifications as s3n,
    Duration,
    RemovalPolicy,
    CfnOutput,
)
from constructs import Construct


class CredentialSharingStack(Stack):
    """
    Credential sharing stack with S3 bucket for temporary file sharing.
    All uploaded files are automatically deleted after 24 hours.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        resource_suffix: str = "",
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        self.resource_suffix = resource_suffix

        # S3 bucket for credential sharing with 24-hour auto-delete
        self.credentials_bucket = s3.Bucket(
            self,
            f"CredentialsBucket{resource_suffix}",
            bucket_name=f"internal-tools-credentials{resource_suffix.lower()}",
            versioned=False,  # No versioning needed for temporary files
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,  # Allow CDK to delete bucket
            auto_delete_objects=True,  # Delete objects when stack is destroyed
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="AutoDelete24Hours",
                    enabled=True,
                    expiration=Duration.hours(24),  # Delete files after 24 hours
                    abort_incomplete_multipart_upload_after=Duration.hours(1),  # Clean up incomplete uploads
                ),
            ],
            cors=[
                s3.CorsRule(
                    allowed_methods=[
                        s3.HttpMethods.GET,
                        s3.HttpMethods.PUT,
                        s3.HttpMethods.POST,
                        s3.HttpMethods.DELETE,
                        s3.HttpMethods.HEAD,
                    ],
                    allowed_origins=["*"],  # Restrict this in production to your domains
                    allowed_headers=["*"],
                    max_age=3000,
                )
            ],
        )

        # Optional: S3 bucket for logs of what was uploaded (with longer retention)
        self.access_logs_bucket = s3.Bucket(
            self,
            f"CredentialsLogsBucket{resource_suffix}",
            bucket_name=f"internal-tools-credentials-logs{resource_suffix.lower()}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteLogs30Days",
                    enabled=True,
                    expiration=Duration.days(30),  # Keep logs for 30 days
                ),
            ],
        )

        # Enable access logging on the main bucket
        self.credentials_bucket.add_property_override(
            "LoggingConfiguration",
            {
                "DestinationBucketName": self.access_logs_bucket.bucket_name,
                "LogFilePrefix": "access-logs/",
            }
        )

        # Outputs for easy access to bucket information
        CfnOutput(
            self,
            f"CredentialsBucketName{resource_suffix}",
            value=self.credentials_bucket.bucket_name,
            description=f"S3 bucket for credential sharing{resource_suffix}",
        )

        CfnOutput(
            self,
            f"CredentialsBucketArn{resource_suffix}",
            value=self.credentials_bucket.bucket_arn,
            description=f"ARN of the credentials bucket{resource_suffix}",
        )

        CfnOutput(
            self,
            f"BucketPolicy{resource_suffix}",
            value="Files uploaded to this bucket will be automatically deleted after 24 hours",
            description="Bucket retention policy",
        )