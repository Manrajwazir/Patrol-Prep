// infra/lib/infra-stack.ts
//
// This file defines ALL the AWS resources patrolprep uses.
// When you run `cdk deploy`, CDK reads this file, figures out what AWS resources
// should exist, and creates/updates/deletes them until reality matches this code.
//
// Think of it as a shopping list that AWS auto-fulfills.

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
    //
    // Why three separate buckets? Different lifecycle/access needs:
    //  - audio: large files, can be deleted after 30 days
    //  - photos: medium files, kept for compliance
    //  - reports: small PDFs, kept forever, eventually locked
    //
    // CDK auto-generates unique bucket names so you don't have to
    // invent globally-unique strings yourself.
    // ═══════════════════════════════════════════════════════════════

    const audioBucket = new s3.Bucket(this, "AudioBucket", {
      // removalPolicy.DESTROY = when you `cdk destroy`, the bucket gets deleted
      // (safer for dev; in prod you'd want RETAIN)
      removalPolicy: cdk.RemovalPolicy.DESTROY,

      // autoDeleteObjects = when deleting the bucket, empty it first
      // (required because S3 won't let you delete a non-empty bucket)
      autoDeleteObjects: true,

      // Block all public access by default — audio files are sensitive
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,

      // Encrypt files at rest using S3-managed keys (free, automatic)
      encryption: s3.BucketEncryption.S3_MANAGED,

      // CORS config: allows our Next.js frontend to upload directly to S3
      // using presigned URLs. The "*" origin will be tightened in prod.
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
    //
    // DynamoDB is AWS's NoSQL key-value database. Every item has a
    // partition key (required) and optionally a sort key.
    // It's serverless — no servers to manage, no connection pooling.
    // You pay per read/write request (or provisioned capacity).
    //
    // Our incidents table has:
    //  - partition key: incidentId (like "GL-2026-04-25-0847")
    //  - a secondary index on "status" so supervisors can list
    //    submitted-vs-draft incidents efficiently.
    // ═══════════════════════════════════════════════════════════════

    const incidentsTable = new dynamodb.Table(this, "IncidentsTable", {
      partitionKey: {
        name: "incidentId",
        type: dynamodb.AttributeType.STRING,
      },

      // PAY_PER_REQUEST = only pay for what you use (ideal for hackathons)
      // Alternative is PROVISIONED which reserves capacity
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,

      // Stream: lets Lambda functions react to changes in real time.
      // We'll use this on April 25 to push new incidents to the
      // supervisor dashboard via WebSocket.
      stream: dynamodb.StreamViewType.NEW_IMAGE,

      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Secondary index: query all incidents by status ("submitted", "draft", etc.)
    incidentsTable.addGlobalSecondaryIndex({
      indexName: "status-timestamp-index",
      partitionKey: { name: "status", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "timestamp", type: dynamodb.AttributeType.STRING },
    });

    // ═══════════════════════════════════════════════════════════════
    // LAMBDA FUNCTIONS
    //
    // Lambdas are serverless functions — code that runs only when
    // triggered. No servers to manage. Pay only for execution time.
    //
    // We define FOUR empty Lambda shells here as scaffolding. Their
    // actual logic gets written on April 25. They only exist in the
    // template so the rest of the infrastructure (IAM roles, triggers,
    // permissions) is wired up and ready to go.
    //
    // Each Lambda handler file is in infra/lambdas/ and bundled
    // automatically by CDK's NodejsFunction construct.
    // ═══════════════════════════════════════════════════════════════

    const processLambda = new lambdaNode.NodejsFunction(this, "ProcessLambda", {
      entry: path.join(__dirname, "../lambdas/process.ts"),
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(60),  // max execution time
      memorySize: 1024,                    // MB; also scales CPU proportionally
      environment: {
        INCIDENTS_TABLE: incidentsTable.tableName,
        AUDIO_BUCKET: audioBucket.bucketName,
        PHOTO_BUCKET: photoBucket.bucketName,
        REPORT_BUCKET: reportBucket.bucketName,
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",  // reuse HTTPS connections
      },
    });

    const uploadLambda = new lambdaNode.NodejsFunction(this, "UploadLambda", {
      entry: path.join(__dirname, "../lambdas/upload.ts"),
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(10),
      environment: {
        AUDIO_BUCKET: audioBucket.bucketName,
        PHOTO_BUCKET: photoBucket.bucketName,
      },
    });

    const listLambda = new lambdaNode.NodejsFunction(this, "ListLambda", {
      entry: path.join(__dirname, "../lambdas/list.ts"),
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(10),
      environment: {
        INCIDENTS_TABLE: incidentsTable.tableName,
      },
    });

    const getLambda = new lambdaNode.NodejsFunction(this, "GetLambda", {
      entry: path.join(__dirname, "../lambdas/get.ts"),
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(10),
      environment: {
        INCIDENTS_TABLE: incidentsTable.tableName,
        REPORT_BUCKET: reportBucket.bucketName,
      },
    });

    // ═══════════════════════════════════════════════════════════════
    // IAM PERMISSIONS (CRITICAL — this is where most beginners trip)
    //
    // Lambdas run with an "execution role" that determines what AWS
    // resources they can access. By default they can't do ANYTHING.
    // We explicitly grant each Lambda only the permissions it needs.
    //
    // Pattern: resource.grantX(lambda) — CDK creates the IAM policy
    // statement automatically. Way less error-prone than writing
    // JSON policies by hand.
    // ═══════════════════════════════════════════════════════════════

    // Process Lambda needs to read audio/photos, write to DynamoDB,
    // call Transcribe/Bedrock/Rekognition, and write the final PDF.
    audioBucket.grantRead(processLambda);
    photoBucket.grantRead(processLambda);
    reportBucket.grantWrite(processLambda);
    incidentsTable.grantReadWriteData(processLambda);

    // Bedrock and Transcribe don't have resource-level permissions,
    // so we add inline policies for them.
    processLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        "bedrock:InvokeModel",
        "bedrock:Converse",
      ],
      // Bedrock requires the "*" resource for cross-region inference profiles
      resources: ["*"],
    }));

    processLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        "transcribe:StartTranscriptionJob",
        "transcribe:GetTranscriptionJob",
      ],
      resources: ["*"],
    }));

    processLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        "rekognition:DetectLabels",
        "rekognition:DetectText",
      ],
      resources: ["*"],
    }));

    // Upload Lambda only needs to generate presigned URLs (no actual upload)
    audioBucket.grantPut(uploadLambda);
    photoBucket.grantPut(uploadLambda);

    // List Lambda: read-only on incidents table
    incidentsTable.grantReadData(listLambda);

    // Get Lambda: read incidents, read PDF reports
    incidentsTable.grantReadData(getLambda);
    reportBucket.grantRead(getLambda);

    // ═══════════════════════════════════════════════════════════════
    // S3 EVENT TRIGGER
    //
    // When a new audio file lands in the audio bucket, automatically
    // fire the process Lambda. This is the "reactive" part of the
    // architecture — no polling, no cron jobs. Just "on upload, run."
    // ═══════════════════════════════════════════════════════════════

    audioBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new cdk.aws_s3_notifications.LambdaDestination(processLambda),
      { prefix: "incoming/" }  // only files under /incoming/ trigger it
    );

    // ═══════════════════════════════════════════════════════════════
    // API GATEWAY — HTTP endpoints for the frontend
    //
    // The frontend (Next.js) talks to these routes to upload files,
    // list incidents, get incident details. Each route maps to a Lambda.
    //
    // CORS is set to "*" for hackathon dev. Tighten for production.
    // ═══════════════════════════════════════════════════════════════

    const api = new apigateway.RestApi(this, "patrolprepApi", {
      restApiName: "patrolprep-api",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["Content-Type", "Authorization"],
      },
    });

    // POST /upload — returns a presigned S3 URL to the frontend
    const uploadResource = api.root.addResource("upload");
    uploadResource.addMethod("POST", new apigateway.LambdaIntegration(uploadLambda));

    // GET /incidents — list all incidents
    const incidentsResource = api.root.addResource("incidents");
    incidentsResource.addMethod("GET", new apigateway.LambdaIntegration(listLambda));

    // GET /incidents/{id} — fetch one
    const incidentResource = incidentsResource.addResource("{id}");
    incidentResource.addMethod("GET", new apigateway.LambdaIntegration(getLambda));

    // ═══════════════════════════════════════════════════════════════
    // CLOUDFORMATION OUTPUTS
    //
    // After `cdk deploy` finishes, these values get printed so you
    // can copy them into your frontend's .env file.
    // ═══════════════════════════════════════════════════════════════

    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url,
      description: "API Gateway base URL — paste into NEXT_PUBLIC_API_URL",
    });

    new cdk.CfnOutput(this, "AudioBucketName", {
      value: audioBucket.bucketName,
      description: "S3 bucket for audio uploads",
    });

    new cdk.CfnOutput(this, "IncidentsTableName", {
      value: incidentsTable.tableName,
      description: "DynamoDB table for incidents",
    });

    new cdk.CfnOutput(this, "Region", {
      value: this.region,
      description: "AWS region",
    });
  }
}