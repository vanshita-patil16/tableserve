# TABLESERVE: AWS Cloud Integration Guide

## 1. Amazon SNS Integration (Reservation Confirmations)

### Architecture
When a reservation is locked, the Reservation Service emits an event:
- **Local Dev Mode**: Logs simulated SNS event receipt to console and returns simulated confirmation payload.
- **AWS Cloud Mode**: Calls `@aws-sdk/client-sns` Publish API.

### Setup Steps
1. Create an SNS Topic (or use the topic created by CloudFormation).
2. Subscribe an email or SMS phone number to the topic:
   ```bash
   aws sns subscribe \
     --topic-arn <TOPIC_ARN> \
     --protocol email \
     --notification-endpoint customer@example.com
   ```
3. Set environment variable in `services/reservation-service`:
   ```bash
   AWS_SNS_TOPIC_ARN=arn:aws:sns:us-east-1:123456789012:tableserve-prod-reservation-confirmations
   AWS_REGION=us-east-1
   ```

---

## 2. Amazon Lex v2 Bot Integration

### Bot Schema
The complete bot export definition is located at:
`aws/lex/tableserve-lex-bot.json`

### Importing into Amazon Lex v2 Console:
1. Open the **Amazon Lex** console in `us-east-1`.
2. Click **Bots** -> **Action** -> **Import**.
3. Select `aws/lex/tableserve-lex-bot.json` and upload.
4. Click **Build** to generate the NLU natural language model.
5. Create a bot alias (e.g. `ProdAlias`).
6. Update your `.env` with the bot IDs:
   ```bash
   AWS_LEX_BOT_ID=XXXXXXXXXX
   AWS_LEX_BOT_ALIAS_ID=XXXXXXXXXX
   ```

---

## 3. Amazon S3 & CloudFront (Frontend Hosting)

### Deploying the React Frontend to S3:
```bash
# Upload static assets to S3 bucket
aws s3 sync frontend/ s3://<YOUR_FRONTEND_BUCKET_NAME>/ --delete

# Set public read on static assets
aws s3 cp s3://<YOUR_FRONTEND_BUCKET_NAME>/index.html s3://<YOUR_FRONTEND_BUCKET_NAME>/index.html \
  --metadata-directive REPLACE \
  --content-type "text/html"
```

---

## 4. Amazon ECR & Container Deployment

### Push Docker Images to ECR:
```bash
# Authenticate Docker to Amazon ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# Build and tag image
docker build -t tableserve/restaurant-service -f services/restaurant-service/Dockerfile .
docker tag tableserve/restaurant-service:latest <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/tableserve/restaurant-service:latest

# Push image
docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/tableserve/restaurant-service:latest
```
Repeat for Reservation, Ordering, Search, and Gateway services.
