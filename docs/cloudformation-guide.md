# TABLESERVE: CloudFormation Deployment Guide

## 1. Overview
The infrastructure template is located at:
`aws/cloudformation/tableserve-infrastructure.yaml`

It provisions:
- **Networking**: VPC (`10.0.0.0/16`), 2 Public Subnets, 2 Private Subnets, Internet Gateway, NAT Gateway.
- **Security**: Security Groups for ALB, EC2 microservices, and RDS PostgreSQL.
- **Compute**: Dedicated EC2 instances for each microservice with least-privilege IAM instance profiles.
- **Load Balancing**: Application Load Balancer with 5 target groups and path-based listener rules.
- **Database**: Amazon RDS PostgreSQL 16 Multi-AZ instance.
- **Storage**: Amazon S3 (static website hosting + media assets) and Amazon ECR repositories.
- **Notifications**: Amazon SNS topic for reservation receipts.
- **DNS**: Route 53 private hosted zone (`tableserve.internal`).

---

## 2. Deployment Prerequisites
1. **AWS CLI** installed and configured (`aws configure`).
2. Sufficient IAM permissions to create CloudFormation stacks, VPCs, EC2 instances, and RDS databases.
3. Target region: `us-east-1` (or adjust region parameter).

---

## 3. Deployment via AWS CLI

### Step 1: Validate CloudFormation Template
```bash
aws cloudformation validate-template \
  --template-body file://aws/cloudformation/tableserve-infrastructure.yaml \
  --region us-east-1
```

### Step 2: Deploy Stack
```bash
aws cloudformation create-stack \
  --stack-name tableserve-production \
  --template-body file://aws/cloudformation/tableserve-infrastructure.yaml \
  --parameters \
      ParameterKey=EnvironmentName,ParameterValue=tableserve-prod \
      ParameterKey=DBUsername,ParameterValue=tableserve_admin \
      ParameterKey=DBPassword,ParameterValue=YourSecureDBPassword2026! \
      ParameterKey=InstanceType,ParameterValue=t3.micro \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Step 3: Monitor Stack Progress
```bash
aws cloudformation wait stack-create-complete \
  --stack-name tableserve-production \
  --region us-east-1
```

### Step 4: Retrieve Deployed Outputs
```bash
aws cloudformation describe-stacks \
  --stack-name tableserve-production \
  --query "Stacks[0].Outputs" \
  --output table \
  --region us-east-1
```
This prints the Public Load Balancer DNS, RDS Cluster Endpoint, S3 Website URL, and SNS Topic ARN!

---

## 4. Deploying via AWS Management Console
1. Log into the AWS Console and navigate to **CloudFormation**.
2. Click **Create stack** -> **With new resources (standard)**.
3. Under **Template source**, select **Upload a template file** and choose `aws/cloudformation/tableserve-infrastructure.yaml`.
4. Enter Stack Name: `tableserve-production`.
5. Configure DB credentials and EC2 instance type.
6. Acknowledge IAM capabilities (`CAPABILITY_NAMED_IAM`) and click **Submit**.
7. Once status reaches `CREATE_COMPLETE`, view the **Outputs** tab for your live endpoints.
