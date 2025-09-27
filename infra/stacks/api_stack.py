from aws_cdk import (
    Stack,
    aws_apigateway as apigateway,
    CfnOutput,
)
from constructs import Construct


class ApiStack(Stack):
    """
    Simple API Gateway stack for Internal Tools.
    Ready for future Lambda integrations when needed.
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

        # API Gateway
        self.api = apigateway.RestApi(
            self,
            f"InternalToolsApi{resource_suffix}",
            rest_api_name=f"internal-tools-api{resource_suffix}",
            description=f"Internal Tools API Gateway{resource_suffix}",
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS,
                allow_headers=["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key"],
            ),
            deploy_options=apigateway.StageOptions(
                stage_name="v1",
                throttling_rate_limit=1000,
                throttling_burst_limit=2000,
                logging_level=apigateway.MethodLoggingLevel.INFO,
            ),
        )

        # Mock integration for placeholder endpoints
        mock_integration = apigateway.MockIntegration(
            integration_responses=[
                apigateway.IntegrationResponse(
                    status_code="200",
                    response_templates={
                        "application/json": '{"message": "API Gateway ready for integration"}'
                    },
                )
            ],
            request_templates={
                "application/json": '{"statusCode": 200}'
            },
        )

        # Health check endpoint
        health = self.api.root.add_resource("health")
        health.add_method(
            "GET",
            mock_integration,
            method_responses=[
                apigateway.MethodResponse(status_code="200")
            ]
        )

        # Placeholder for future endpoints
        api_v1 = self.api.root.add_resource("api")
        api_v1.add_method(
            "GET",
            mock_integration,
            method_responses=[
                apigateway.MethodResponse(status_code="200")
            ]
        )

        # API Key for future use
        self.api_key = self.api.add_api_key(
            f"InternalToolsApiKey{resource_suffix}",
            api_key_name=f"internal-tools-key{resource_suffix}",
            description=f"API key for Internal Tools{resource_suffix}",
        )

        # Usage plan
        self.usage_plan = self.api.add_usage_plan(
            f"InternalToolsUsagePlan{resource_suffix}",
            name=f"internal-tools-usage{resource_suffix}",
            description=f"Usage plan for Internal Tools API{resource_suffix}",
            throttle=apigateway.ThrottleSettings(rate_limit=100, burst_limit=200),
            quota=apigateway.QuotaSettings(limit=10000, period=apigateway.Period.DAY),
            api_stages=[
                apigateway.UsagePlanPerApiStage(
                    api=self.api,
                    stage=self.api.deployment_stage,
                )
            ],
        )

        # Associate API key with usage plan
        self.usage_plan.add_api_key(self.api_key)

        # Outputs
        CfnOutput(
            self,
            f"ApiEndpoint{resource_suffix}",
            value=self.api.url,
            description=f"Internal Tools API Gateway endpoint{resource_suffix}",
        )

        CfnOutput(
            self,
            f"ApiKeyId{resource_suffix}",
            value=self.api_key.key_id,
            description=f"Internal Tools API Key ID{resource_suffix}",
        )