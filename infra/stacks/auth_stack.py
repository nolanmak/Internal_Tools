from aws_cdk import (
    Stack,
    aws_cognito as cognito,
    aws_iam as iam,
    Duration,
    RemovalPolicy,
    CfnOutput,
)
from constructs import Construct


class AuthStack(Stack):
    """
    Cognito authentication stack with user pool and app client for ShadowShare.
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

        # Cognito User Pool
        self.user_pool = cognito.UserPool(
            self,
            f"ShadowShareUserPool{resource_suffix}",
            user_pool_name=f"shadowshare-users{resource_suffix}",

            # Sign-in options
            sign_in_aliases=cognito.SignInAliases(
                email=True,
                username=True,
            ),

            # Self sign-up configuration
            self_sign_up_enabled=True,
            auto_verify=cognito.AutoVerifiedAttrs(email=True),

            # User verification
            user_verification=cognito.UserVerificationConfig(
                email_subject="ShadowShare - Verify your email",
                email_body="Thank you for signing up to ShadowShare! Your verification code is {####}",
                email_style=cognito.VerificationEmailStyle.CODE,
            ),

            # Password policy
            password_policy=cognito.PasswordPolicy(
                min_length=8,
                require_lowercase=True,
                require_uppercase=True,
                require_digits=True,
                require_symbols=False,
            ),

            # Standard attributes
            standard_attributes=cognito.StandardAttributes(
                email=cognito.StandardAttribute(required=True, mutable=True),
                given_name=cognito.StandardAttribute(required=False, mutable=True),
                family_name=cognito.StandardAttribute(required=False, mutable=True),
            ),

            # Account recovery
            account_recovery=cognito.AccountRecovery.EMAIL_ONLY,

            # Deletion protection for production
            removal_policy=RemovalPolicy.DESTROY if resource_suffix else RemovalPolicy.RETAIN,
        )

        # Cognito User Pool Client (for web app)
        self.user_pool_client = cognito.UserPoolClient(
            self,
            f"ShadowShareWebClient{resource_suffix}",
            user_pool=self.user_pool,
            user_pool_client_name=f"shadowshare-web-client{resource_suffix}",

            # OAuth settings
            auth_flows=cognito.AuthFlow(
                user_password=True,
                user_srp=True,
                custom=False,
                admin_user_password=True,
            ),

            # Token validity
            access_token_validity=Duration.hours(1),
            id_token_validity=Duration.hours(1),
            refresh_token_validity=Duration.days(30),

            # Prevent user existence errors for security
            prevent_user_existence_errors=True,

            # OAuth scopes
            o_auth=cognito.OAuthSettings(
                flows=cognito.OAuthFlows(
                    authorization_code_grant=True,
                    implicit_code_grant=False,
                ),
                scopes=[
                    cognito.OAuthScope.EMAIL,
                    cognito.OAuthScope.OPENID,
                    cognito.OAuthScope.PROFILE,
                ],
                callback_urls=[
                    "http://localhost:3000",
                    "https://localhost:3000",
                    # Add your production domain here when you have it
                    # "https://yourdomain.com",
                ],
                logout_urls=[
                    "http://localhost:3000",
                    "https://localhost:3000",
                    # Add your production domain here when you have it
                    # "https://yourdomain.com",
                ],
            ),

            # Generate secret for server-side apps (optional)
            generate_secret=False,  # Set to True if using server-side authentication
        )

        # Cognito Identity Pool (for accessing AWS resources)
        self.identity_pool = cognito.CfnIdentityPool(
            self,
            f"ShadowShareIdentityPool{resource_suffix}",
            identity_pool_name=f"shadowshare_identity_pool{resource_suffix}",
            allow_unauthenticated_identities=False,
            cognito_identity_providers=[
                cognito.CfnIdentityPool.CognitoIdentityProviderProperty(
                    client_id=self.user_pool_client.user_pool_client_id,
                    provider_name=self.user_pool.user_pool_provider_name,
                )
            ],
        )

        # IAM role for authenticated users
        self.authenticated_role = iam.Role(
            self,
            f"CognitoAuthenticatedRole{resource_suffix}",
            assumed_by=iam.FederatedPrincipal(
                "cognito-identity.amazonaws.com",
                conditions={
                    "StringEquals": {
                        "cognito-identity.amazonaws.com:aud": self.identity_pool.ref
                    },
                    "ForAnyValue:StringLike": {
                        "cognito-identity.amazonaws.com:amr": "authenticated"
                    },
                },
                assume_role_action="sts:AssumeRoleWithWebIdentity",
            ),
            inline_policies={
                "S3UploadPolicy": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            actions=[
                                "s3:PutObject",
                                "s3:PutObjectAcl",
                                "s3:GetObject",
                            ],
                            resources=[
                                f"arn:aws:s3:::internal-tools-credentials{resource_suffix.lower()}/*"
                            ],
                        )
                    ]
                )
            },
        )

        # Attach the role to the identity pool
        cognito.CfnIdentityPoolRoleAttachment(
            self,
            f"IdentityPoolRoleAttachment{resource_suffix}",
            identity_pool_id=self.identity_pool.ref,
            roles={
                "authenticated": self.authenticated_role.role_arn,
            },
        )

        # Cognito User Pool Domain (for hosted UI)
        self.user_pool_domain = cognito.UserPoolDomain(
            self,
            f"ShadowShareDomain{resource_suffix}",
            user_pool=self.user_pool,
            cognito_domain=cognito.CognitoDomainOptions(
                domain_prefix=f"shadowshare{resource_suffix.lower()}" if resource_suffix else "shadowshare"
            ),
        )

        # Outputs for frontend configuration
        CfnOutput(
            self,
            f"UserPoolId{resource_suffix}",
            value=self.user_pool.user_pool_id,
            description=f"Cognito User Pool ID{resource_suffix}",
        )

        CfnOutput(
            self,
            f"UserPoolClientId{resource_suffix}",
            value=self.user_pool_client.user_pool_client_id,
            description=f"Cognito User Pool Client ID{resource_suffix}",
        )

        CfnOutput(
            self,
            f"IdentityPoolId{resource_suffix}",
            value=self.identity_pool.ref,
            description=f"Cognito Identity Pool ID{resource_suffix}",
        )

        CfnOutput(
            self,
            f"UserPoolDomain{resource_suffix}",
            value=self.user_pool_domain.domain_name,
            description=f"Cognito User Pool Domain{resource_suffix}",
        )

        CfnOutput(
            self,
            f"CognitoHostedUIUrl{resource_suffix}",
            value=f"https://{self.user_pool_domain.domain_name}.auth.{self.region}.amazoncognito.com",
            description=f"Cognito Hosted UI URL{resource_suffix}",
        )