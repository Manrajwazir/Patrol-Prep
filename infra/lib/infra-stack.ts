// infra/lib/infra-stack.ts
// PatrolPrep AWS infrastructure.
// Run `cdk deploy` from the infra/ folder to create/update all resources.

import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNode from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import * as path from "path";

export class PatrolprepStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ═══════════════════════════════════════════════════════════════
    // S3 BUCKETS
    // ═══════════════════════════════════════════════════════════════

    const audioBucket = new s3.Bucket(this, "AudioBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
          maxAge: 3000,
        },
      ],
    });

    const photoBucket = new s3.Bucket(this, "PhotoBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
        },
      ],
    });

    const reportBucket = new s3.Bucket(this, "ReportBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // ═══════════════════════════════════════════════════════════════
    // DYNAMODB TABLE
    // Used for session tracking (P2 feature — not critical for demo)
    // ═══════════════════════════════════════════════════════════════

    const sessionsTable = new dynamodb.Table(this, "SessionsTable", {
      partitionKey: {
        name: "sessionId",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ═══════════════════════════════════════════════════════════════
    // LAMBDA FUNCTIONS
    // ═══════════════════════════════════════════════════════════════

    // Core product Lambda — contextual explanation in user's language
    const explainLambda = new lambdaNode.NodejsFunction(this, "ExplainLambda", {
      entry: path.join(__dirname, "../lambdas/explain.ts"),
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(60),
      memorySize: 1024,
      environment: {
        AUDIO_BUCKET: audioBucket.bucketName,
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      },
    });

    // Drill generator — 3 similar questions on the same concept
    const drillLambda = new lambdaNode.NodejsFunction(this, "DrillLambda", {
      entry: path.join(__dirname, "../lambdas/drill.ts"),
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(60),
      memorySize: 1024,
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      },
    });

    // Free-form voice question answering
    const askLambda = new lambdaNode.NodejsFunction(this, "AskLambda", {
      entry: path.join(__dirname, "../lambdas/ask.ts"),
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(60),
      memorySize: 1024,
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
        MANUAL_BUCKET: process.env.MANUAL_BUCKET_NAME || "REPLACE_ME_IN_AWS_CONSOLE",
        MANUAL_KEY: process.env.MANUAL_FILE_KEY || "manual.txt"
      },
    });

    // Speech to text
    const transcribeLambda = new lambdaNode.NodejsFunction(this, "TranscribeLambda", {
      entry: path.join(__dirname, "../lambdas/transcribe.ts"),
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(120),
      memorySize: 512,
      environment: {
        AUDIO_BUCKET: audioBucket.bucketName,
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      },
    });

    // Text to speech
    const speakLambda = new lambdaNode.NodejsFunction(this, "SpeakLambda", {
      entry: path.join(__dirname, "../lambdas/speak.ts"),
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      },
    });

    // ═══════════════════════════════════════════════════════════════
    // IAM PERMISSIONS
    // ═══════════════════════════════════════════════════════════════

    // Bedrock permissions for explain, drill, ask
    const bedrockPolicy = new iam.PolicyStatement({
      actions: ["bedrock:InvokeModel", "bedrock:Converse"],
      resources: ["*"],
    });

    explainLambda.addToRolePolicy(bedrockPolicy);
    drillLambda.addToRolePolicy(bedrockPolicy);
    askLambda.addToRolePolicy(bedrockPolicy);

    const marketplacePolicy = new iam.PolicyStatement({
      actions: [
        "aws-marketplace:ViewSubscriptions",
        "aws-marketplace:Subscribe",
        "aws-marketplace:Unsubscribe",
      ],
      resources: ["*"],
    });

    explainLambda.addToRolePolicy(marketplacePolicy);
    drillLambda.addToRolePolicy(marketplacePolicy);
    askLambda.addToRolePolicy(marketplacePolicy);

    // Ask Lambda needs S3 read access to fetch the manual
    askLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ["s3:GetObject"],
      resources: ["*"], // Allows reading from any bucket you provide
    }));

    // Transcribe Lambda needs S3 read/write + Transcribe
    audioBucket.grantReadWrite(transcribeLambda);
    transcribeLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        "transcribe:StartTranscriptionJob",
        "transcribe:GetTranscriptionJob",
      ],
      resources: ["*"],
    }));

    // Polly permissions for speak Lambda
    speakLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ["polly:SynthesizeSpeech"],
      resources: ["*"],
    }));

    // Sessions table access
    sessionsTable.grantReadWriteData(explainLambda);

    // ═══════════════════════════════════════════════════════════════
    // API GATEWAY
    // ═══════════════════════════════════════════════════════════════

    const api = new apigateway.RestApi(this, "PatrolprepApi", {
      restApiName: "patrolprep-api",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["Content-Type", "Authorization"],
      },
    });

    // POST /explain — wrong answer → contextual explanation
    const explainResource = api.root.addResource("explain");
    explainResource.addMethod("POST", new apigateway.LambdaIntegration(explainLambda));

    // POST /drill — generate 3 similar questions
    const drillResource = api.root.addResource("drill");
    drillResource.addMethod("POST", new apigateway.LambdaIntegration(drillLambda));

    // POST /ask — free-form voice question
    const askResource = api.root.addResource("ask");
    askResource.addMethod("POST", new apigateway.LambdaIntegration(askLambda));

    // POST /transcribe — audio to text
    const transcribeResource = api.root.addResource("transcribe");
    transcribeResource.addMethod("POST", new apigateway.LambdaIntegration(transcribeLambda));

    // POST /speak — text to audio
    const speakResource = api.root.addResource("speak");
    speakResource.addMethod("POST", new apigateway.LambdaIntegration(speakLambda));

    // ═══════════════════════════════════════════════════════════════
    // OUTPUTS
    // ═══════════════════════════════════════════════════════════════

    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url,
      description: "API Gateway base URL — paste into NEXT_PUBLIC_API_URL",
    });

    new cdk.CfnOutput(this, "AudioBucketName", {
      value: audioBucket.bucketName,
      description: "S3 bucket for audio/manual storage",
    });

    new cdk.CfnOutput(this, "Region", {
      value: this.region,
      description: "AWS region",
    });
  }
}