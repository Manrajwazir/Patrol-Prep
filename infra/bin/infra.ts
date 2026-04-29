#!/usr/bin/env node
// infra/bin/infra.ts
// Entry point CDK uses to discover which stacks to deploy.

import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { PatrolprepStack } from "../lib/infra-stack";

const app = new cdk.App();

new PatrolprepStack(app, "PatrolprepStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: "ca-central-1",
  },
});