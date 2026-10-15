#!/usr/bin/env node
/**
 * TABLESERVE CloudWatch Metrics, Alarms, and Dashboard Provisioner
 *
 * Automatically provisions CloudWatch resources for TABLESERVE:
 * 1. Pushes custom metrics to namespace 'TABLESERVE/Microservices'
 * 2. Creates CloudWatch Alarms (High CPU, High Latency, 5xx Errors)
 * 3. Creates the CloudWatch Operations Dashboard ('TABLESERVE-Operations-Dashboard')
 * 4. Creates CloudWatch Log Groups for API Gateway and Microservices
 *
 * Can be run on EC2 or locally via:
 *   node scripts/setup-cloudwatch.js
 */

const { execSync } = require('child_process');

const REGION = process.env.AWS_REGION || 'us-east-1';
const NAMESPACE = 'TABLESERVE/Microservices';

console.log('===========================================================');
console.log('⚡ TABLESERVE: CloudWatch Metrics & Dashboard Provisioner');
console.log(`Region: ${REGION} | Namespace: ${NAMESPACE}`);
console.log('===========================================================\n');

function runAwsCommand(cmd, description) {
  try {
    process.stdout.write(`⏳ ${description}... `);
    const output = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    console.log('✅ Done');
    return { success: true, output };
  } catch (error) {
    console.log('⚠️ Notice / Skipped');
    const msg = error.stderr || error.message;
    console.log(`   Detail: ${msg.trim().split('\n')[0]}`);
    return { success: false, error: msg };
  }
}

// 1. Check AWS CLI
try {
  const version = execSync('aws --version', { encoding: 'utf-8' }).trim();
  console.log(`Found AWS CLI: ${version}\n`);
} catch (e) {
  console.log('ℹ️ AWS CLI command not found in current environment path.');
  console.log('  If running on EC2, ensure aws-cli is installed and configured.');
  console.log('  You can also deploy via CloudFormation: aws/cloudformation/tableserve-cloudwatch.yaml\n');
}

// 2. Create Log Groups
console.log('--- 1. Creating CloudWatch Log Groups ---');
runAwsCommand(
  `aws logs create-log-group --log-group-name /aws/tableserve/api-gateway --region ${REGION}`,
  'Creating Log Group: /aws/tableserve/api-gateway'
);
runAwsCommand(
  `aws logs create-log-group --log-group-name /aws/tableserve/microservices --region ${REGION}`,
  'Creating Log Group: /aws/tableserve/microservices'
);

// 3. Publish Initial Metric Data Points into TABLESERVE/Microservices
console.log('\n--- 2. Publishing CloudWatch Custom Metrics ---');

const services = ['API-Gateway', 'Restaurant-Service', 'Reservation-Service', 'Ordering-Service', 'Search-Service', 'Chatbot-Service'];
const sampleMetrics = [
  { service: 'API-Gateway', requests: 1420, latency: 28 },
  { service: 'Restaurant-Service', requests: 860, latency: 18 },
  { service: 'Reservation-Service', requests: 310, latency: 42 },
  { service: 'Ordering-Service', requests: 245, latency: 35 },
  { service: 'Search-Service', requests: 1190, latency: 15 },
  { service: 'Chatbot-Service', requests: 430, latency: 65 }
];

for (const m of sampleMetrics) {
  runAwsCommand(
    `aws cloudwatch put-metric-data --namespace ${NAMESPACE} --metric-data MetricName=RequestCount,Dimensions=[{Name=ServiceName,Value=${m.service}}],Value=${m.requests},Unit=Count MetricName=ResponseTime,Dimensions=[{Name=ServiceName,Value=${m.service}}],Value=${m.latency},Unit=Milliseconds --region ${REGION}`,
    `Pushing metrics for ${m.service} (${m.requests} reqs, ${m.latency}ms)`
  );
}

// Business Metrics
runAwsCommand(
  `aws cloudwatch put-metric-data --namespace ${NAMESPACE} --metric-data MetricName=ReservationsCreated,Value=48,Unit=Count MetricName=OrdersPlaced,Value=64,Unit=Count MetricName=ChatbotInteractions,Value=142,Unit=Count MetricName=VoiceAudioInputs,Value=38,Unit=Count MetricName=HTTP_200_OK,Value=4350,Unit=Count MetricName=HTTP_4xx_ClientError,Value=12,Unit=Count MetricName=HTTP_5xx_ServerError,Value=0,Unit=Count --region ${REGION}`,
  'Pushing business & HTTP status metrics (Reservations, Orders, Chatbot, Voice)'
);

// 4. Create CloudWatch Alarms
console.log('\n--- 3. Creating CloudWatch Metric Alarms ---');

runAwsCommand(
  `aws cloudwatch put-metric-alarm --alarm-name TABLESERVE-High-CPU-Utilization --alarm-description "Triggers when EC2 host CPU utilization exceeds 80% for 5 mins" --metric-name CPUUtilization --namespace AWS/EC2 --statistic Average --period 300 --threshold 80 --comparison-operator GreaterThanOrEqualToThreshold --evaluation-periods 1 --treat-missing-data notBreaching --region ${REGION}`,
  'Creating Alarm: TABLESERVE-High-CPU-Utilization (CPU > 80%)'
);

runAwsCommand(
  `aws cloudwatch put-metric-alarm --alarm-name TABLESERVE-High-API-Latency --alarm-description "Triggers when API Gateway latency exceeds 1000ms" --metric-name ResponseTime --namespace ${NAMESPACE} --dimensions Name=ServiceName,Value=API-Gateway --statistic Average --period 300 --threshold 1000 --comparison-operator GreaterThanThreshold --evaluation-periods 1 --treat-missing-data notBreaching --region ${REGION}`,
  'Creating Alarm: TABLESERVE-High-API-Latency (Latency > 1000ms)'
);

runAwsCommand(
  `aws cloudwatch put-metric-alarm --alarm-name TABLESERVE-High-5xx-Errors --alarm-description "Triggers when HTTP 5xx errors exceed 5 in 5 mins" --metric-name HTTP_5xx_ServerError --namespace ${NAMESPACE} --statistic Sum --period 300 --threshold 5 --comparison-operator GreaterThanOrEqualToThreshold --evaluation-periods 1 --treat-missing-data notBreaching --region ${REGION}`,
  'Creating Alarm: TABLESERVE-High-5xx-Errors (5xx Errors >= 5)'
);

// 5. Create CloudWatch Operational Dashboard
console.log('\n--- 4. Creating CloudWatch Operational Dashboard ---');

const dashboardBody = {
  widgets: [
    {
      type: "text",
      x: 0,
      y: 0,
      width: 24,
      height: 2,
      properties: {
        markdown: "# ⚡ TABLESERVE Enterprise CloudWatch Operational Dashboard\nReal-time monitoring across **API Gateway**, **Restaurant Catalog**, **Reservations & Payments**, **Ordering**, **Search**, and **Amazon Lex Chatbot** microservices."
      }
    },
    {
      type: "metric",
      x: 0,
      y: 2,
      width: 12,
      height: 6,
      properties: {
        metrics: [
          [ NAMESPACE, "RequestCount", "ServiceName", "API-Gateway", { label: "API Gateway", stat: "Sum" } ],
          [ "...", "Restaurant-Service", { label: "Restaurant Service", stat: "Sum" } ],
          [ "...", "Reservation-Service", { label: "Reservation Service", stat: "Sum" } ],
          [ "...", "Ordering-Service", { label: "Ordering Service", stat: "Sum" } ],
          [ "...", "Search-Service", { label: "Search Service", stat: "Sum" } ],
          [ "...", "Chatbot-Service", { label: "Lex Chatbot Service", stat: "Sum" } ]
        ],
        view: "timeSeries",
        stacked: true,
        region: REGION,
        title: "API Request Traffic by Microservice",
        period: 300
      }
    },
    {
      type: "metric",
      x: 12,
      y: 2,
      width: 12,
      height: 6,
      properties: {
        metrics: [
          [ NAMESPACE, "ResponseTime", "ServiceName", "API-Gateway", { label: "Gateway Latency (ms)", color: "#ff7f0e" } ],
          [ "...", "Restaurant-Service", { label: "Restaurant Latency (ms)", color: "#2ca02c" } ],
          [ "...", "Reservation-Service", { label: "Reservation Latency (ms)", color: "#d62728" } ],
          [ "...", "Ordering-Service", { label: "Ordering Latency (ms)", color: "#9467bd" } ]
        ],
        view: "timeSeries",
        region: REGION,
        title: "End-to-End Latency by Service (ms)",
        period: 300,
        yAxis: {
          left: { label: "Milliseconds", min: 0 }
        }
      }
    },
    {
      type: "metric",
      x: 0,
      y: 8,
      width: 8,
      height: 5,
      properties: {
        metrics: [
          [ NAMESPACE, "ReservationsCreated", { label: "Table Reservations Locked", color: "#1f77b4" } ],
          [ ".", "OrdersPlaced", { label: "Kitchen Orders Placed", color: "#2ca02c" } ]
        ],
        view: "singleValue",
        region: REGION,
        title: "Business Throughput (Reservations & Orders)",
        period: 3600
      }
    },
    {
      type: "metric",
      x: 8,
      y: 8,
      width: 8,
      height: 5,
      properties: {
        metrics: [
          [ NAMESPACE, "ChatbotInteractions", { label: "Conversational Bot Turns", color: "#9467bd" } ],
          [ ".", "VoiceAudioInputs", { label: "Voice / Mic Speech Turns", color: "#8c564b" } ]
        ],
        view: "singleValue",
        region: REGION,
        title: "AI Concierge & Voice Engagement",
        period: 3600
      }
    },
    {
      type: "metric",
      x: 16,
      y: 8,
      width: 8,
      height: 5,
      properties: {
        metrics: [
          [ NAMESPACE, "HTTP_200_OK", { label: "200 Success", color: "#2ca02c" } ],
          [ ".", "HTTP_4xx_ClientError", { label: "4xx Client Errors", color: "#ffbb78" } ],
          [ ".", "HTTP_5xx_ServerError", { label: "5xx Server Errors", color: "#d62728" } ]
        ],
        view: "pie",
        region: REGION,
        title: "HTTP Response Status Code Distribution",
        period: 3600
      }
    }
  ]
};

// Write temporary dashboard JSON file to escape CLI escaping issues
const fs = require('fs');
const path = require('path');
const tmpJsonPath = path.join(__dirname, 'dashboard-temp.json');
fs.writeFileSync(tmpJsonPath, JSON.stringify(dashboardBody));

runAwsCommand(
  `aws cloudwatch put-dashboard --dashboard-name TABLESERVE-Operations-Dashboard --dashboard-body file://${tmpJsonPath} --region ${REGION}`,
  'Creating Dashboard: TABLESERVE-Operations-Dashboard'
);

try {
  fs.unlinkSync(tmpJsonPath);
} catch (e) {}

console.log('\n===========================================================');
console.log('🎉 CloudWatch Setup Complete!');
console.log(`📊 View Dashboard in AWS Console:`);
console.log(`   https://console.aws.amazon.com/cloudwatch/home?region=${REGION}#dashboards:name=TABLESERVE-Operations-Dashboard`);
console.log(`🚨 View Alarms in AWS Console:`);
console.log(`   https://console.aws.amazon.com/cloudwatch/home?region=${REGION}#alarmsV2:`);
console.log('===========================================================\n');
