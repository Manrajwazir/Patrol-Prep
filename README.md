# patrolprep Starter

A production-ready Next.js + AWS starter template for the DevCon Edmonton 2026 hackathon.

## Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui
- **Infrastructure:** AWS CDK (TypeScript)
- **Backend:** AWS Lambda + API Gateway + DynamoDB + S3
- **Region:** ca-central-1 (data residency in Canada)
- **AI services ready:** Amazon Bedrock, Transcribe, Rekognition

## Local dev

    pnpm install
    pnpm dev

Opens at http://localhost:3000.

## Deploy infrastructure

    cd infra
    $env:AWS_PROFILE="patrolprep"
    cdk deploy

Outputs the API Gateway URL — paste into .env.local as NEXT_PUBLIC_API_URL.

## Deploy frontend

Pushed to main → auto-deployed by Amplify Hosting.

## Teardown

    cd infra
    cdk destroy

Deletes every resource. No stray costs.