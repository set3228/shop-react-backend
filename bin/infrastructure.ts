#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ProductServiceStack } from '../lib/product-service/product-service-stack';
import { ImportServiceStack } from '../lib/import-service/import-service-stack';
import { AuthorizationServiceStack } from '../lib/authorization-service/authorization-service-stack';

const app = new cdk.App();
const productServiceStack = new ProductServiceStack(app, 'ProductServiceStack', {});
const importServiceStack = new ImportServiceStack(app, 'ImportServiceStack', {});
const authorizationServiceStack = new AuthorizationServiceStack(app, 'AuthorizationServiceStack', {});

importServiceStack.addDependency(productServiceStack);
