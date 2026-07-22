/**
 * Orin Baseline Load Test Script
 * Simulates 100 concurrent virtual users (VUs) for 60 seconds.
 * Measures Requests Per Second (RPS), Latencies (Min, Max, Avg, Percentiles).
 * Generates a styled Excel report of the results.
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const TARGET_URL = process.env.TARGET_URL || 'http://localhost:5000/api/events';
const CONCURRENCY = parseInt(process.env.CONCURRENCY, 10) || 100;
const DURATION_MS = parseInt(process.env.DURATION, 10) || 60000; // Default 1 minute

const COLORS = {
  brandPurple:  'FF7B61FF',
  brandPurpleLight: 'FFD4CCFF',
  headerText:   'FFFFFFFF',
  passedStatus: 'FF00B050',
  passedStatusLight: 'FFE2FFEC',
  fail:         'FFFF0000',
  failLight:    'FFFFEBEE',
  darkText:     'FF1A1A1A',
  mutedText:    'FF6C757D',
  rowAlt:       'FFF8F9FA',
  borderColor:  'FFE9ECEF',
};

const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.brandPurple } };
const HEADER_FONT = { bold: true, color: { argb: COLORS.headerText }, size: 11, name: 'Calibri' };
const BODY_FONT   = { name: 'Calibri', size: 10 };

function applyBorder(row) {
  row.eachCell(cell => {
    cell.border = {
      top:    { style: 'thin', color: { argb: COLORS.borderColor } },
      left:   { style: 'thin', color: { argb: COLORS.borderColor } },
      bottom: { style: 'thin', color: { argb: COLORS.borderColor } },
      right:  { style: 'thin', color: { argb: COLORS.borderColor } },
    };
  });
}

async function runLoadTest() {
  console.log(`===================================================`);
  console.log(`🚀 ORIN LOAD TESTING ENGINE STARTED`);
  console.log(`===================================================`);
  console.log(`Target URL  : ${TARGET_URL}`);
  console.log(`Concurrency : ${CONCURRENCY} VUs`);
  console.log(`Duration    : ${DURATION_MS / 1000} seconds`);
  console.log(`===================================================\n`);

  const results = [];
  let keepRunning = true;
  const startTime = Date.now();

  const parsedUrl = new URL(TARGET_URL);
  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port,
    path: parsedUrl.pathname,
    method: 'GET',
    agent: new http.Agent({ keepAlive: true, maxSockets: CONCURRENCY })
  };

  function sendRequest() {
    return new Promise((resolve) => {
      const reqStart = Date.now();
      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          const duration = Date.now() - reqStart;
          resolve({
            status: res.statusCode,
            duration,
            success: res.statusCode === 200
          });
        });
      });

      req.on('error', (err) => {
        const duration = Date.now() - reqStart;
        resolve({
          status: 0,
          duration,
          success: false,
          error: err.message
        });
      });

      req.end();
    });
  }

  // Worker loop representing a single virtual user
  async function runVirtualUser() {
    while (keepRunning) {
      const res = await sendRequest();
      results.push(res);
    }
  }

  // Start concurrent virtual users
  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(runVirtualUser());
  }

  // Running for the specified duration
  let elapsedSeconds = 0;
  const interval = setInterval(() => {
    elapsedSeconds += 5;
    const progressRPS = (results.length / elapsedSeconds).toFixed(1);
    console.log(`[Progress] Running: ${elapsedSeconds}s | Requests sent: ${results.length} | Est RPS: ${progressRPS}`);
  }, 5000);

  await new Promise((resolve) => {
    setTimeout(() => {
      keepRunning = false;
      clearInterval(interval);
      resolve();
    }, DURATION_MS);
  });

  // Wait for all active requests to complete
  await Promise.all(workers);

  const totalTime = Date.now() - startTime;
  console.log(`\n===================================================`);
  console.log(`🏁 LOAD TEST COMPLETE`);
  console.log(`===================================================`);

  const totalRequests = results.length;
  const successfulRequests = results.filter(r => r.success).length;
  const failedRequests = totalRequests - successfulRequests;
  const rps = (totalRequests / (totalTime / 1000)).toFixed(2);

  const latencies = results.map(r => r.duration).sort((a, b) => a - b);
  const minLatency = latencies.length > 0 ? latencies[0] : 0;
  const maxLatency = latencies.length > 0 ? latencies[latencies.length - 1] : 0;
  const avgLatency = latencies.length > 0 
    ? (latencies.reduce((sum, val) => sum + val, 0) / latencies.length)
    : 0;

  const getPercentile = (p) => {
    if (latencies.length === 0) return 0;
    const index = Math.floor((p / 100) * latencies.length);
    return latencies[Math.min(index, latencies.length - 1)];
  };

  const p50 = getPercentile(50);
  const p90 = getPercentile(90);
  const p95 = getPercentile(95);
  const p99 = getPercentile(99);

  console.log(`Total Requests Sent : ${totalRequests}`);
  console.log(`Successful Requests : ${successfulRequests} (${((successfulRequests / totalRequests) * 100).toFixed(1)}%)`);
  console.log(`Failed Requests     : ${failedRequests}`);
  console.log(`Avg RPS             : ${rps} req/sec`);
  console.log(`Latency             : Avg: ${avgLatency.toFixed(1)}ms | Min: ${minLatency}ms | Max: ${maxLatency}ms`);
  console.log(`Percentiles         : p50: ${p50}ms | p90: ${p90}ms | p95: ${p95}ms | p99: ${p99}ms`);
  console.log(`===================================================\n`);

  await generateExcelReport({
    targetUrl: TARGET_URL,
    concurrency: CONCURRENCY,
    durationMs: DURATION_MS,
    totalRequests,
    successfulRequests,
    failedRequests,
    rps,
    minLatency,
    maxLatency,
    avgLatency,
    p50,
    p90,
    p95,
    p99,
    rawResults: results
  });
}

async function generateExcelReport(metrics) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Orin Load Testing Engine';
  workbook.lastModifiedBy = 'Antigravity Agent';
  workbook.created = new Date();

  // 1. Summary Sheet
  const wsSummary = workbook.addWorksheet('📊 Load Test Summary', {
    properties: { tabColor: { argb: COLORS.brandPurple } }
  });

  // Title Row
  wsSummary.mergeCells('A1:D1');
  const titleCell = wsSummary.getCell('A1');
  titleCell.value = '🟣 Orin Application — Baseline Load Test Report';
  titleCell.font = { bold: true, size: 16, name: 'Calibri', color: { argb: COLORS.brandPurple } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  wsSummary.getRow(1).height = 40;

  wsSummary.addRow([]);

  // Section header
  const secHeader = wsSummary.addRow(['Test Parameters & Config']);
  secHeader.getCell(1).font = { bold: true, size: 12, color: { argb: COLORS.brandPurple }, name: 'Calibri' };
  wsSummary.addRow([]);

  const configData = [
    ['Target URL',           metrics.targetUrl],
    ['Concurrency (VUs)',    metrics.concurrency],
    ['Test Duration',        `${metrics.durationMs / 1000}s`],
    ['Run Timestamp',        new Date().toLocaleString()]
  ];

  configData.forEach(([metric, val], idx) => {
    const row = wsSummary.addRow([metric, val]);
    row.getCell(1).font = { bold: true, ...BODY_FONT };
    row.getCell(2).font = BODY_FONT;
    if (idx % 2 === 0) {
      row.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.rowAlt } });
    }
    applyBorder(row);
  });

  wsSummary.addRow([]);

  const resultsHeader = wsSummary.addRow(['Performance Results Metrics']);
  resultsHeader.getCell(1).font = { bold: true, size: 12, color: { argb: COLORS.brandPurple }, name: 'Calibri' };
  wsSummary.addRow([]);

  const resultsData = [
    ['Total Requests Sent',  metrics.totalRequests],
    ['✅ Successful Requests', metrics.successfulRequests],
    ['❌ Failed Requests',     metrics.failedRequests],
    ['📈 Average RPS',         parseFloat(metrics.rps)],
    ['⏱ Average Latency',     `${metrics.avgLatency.toFixed(1)}ms`],
    ['⚡ Min Latency',         `${metrics.minLatency}ms`],
    ['🐢 Max Latency',         `${metrics.maxLatency}ms`],
    ['p50 (Median Latency)',   `${metrics.p50}ms`],
    ['p90 Latency',            `${metrics.p90}ms`],
    ['p95 Latency',            `${metrics.p95}ms`],
    ['p99 Latency',            `${metrics.p99}ms`]
  ];

  resultsData.forEach(([metric, val], idx) => {
    const row = wsSummary.addRow([metric, val]);
    row.getCell(1).font = { bold: true, ...BODY_FONT };
    row.getCell(2).font = BODY_FONT;
    if (idx % 2 === 0) {
      row.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.rowAlt } });
    }
    applyBorder(row);
  });

  wsSummary.getColumn(1).width = 30;
  wsSummary.getColumn(2).width = 45;

  // 2. Request Log Sheet
  const wsLog = workbook.addWorksheet('📋 Request Log', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  wsLog.columns = [
    { header: 'Req #',      key: 'id',       width: 12 },
    { header: 'Status Code', key: 'status',   width: 15 },
    { header: 'Latency (ms)', key: 'latency',  width: 18 },
    { header: 'Outcome',     key: 'outcome',  width: 15 }
  ];

  const headerRow = wsLog.getRow(1);
  headerRow.font = HEADER_FONT;
  headerRow.fill = HEADER_FILL;
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 28;
  applyBorder(headerRow);

  metrics.rawResults.forEach((res, idx) => {
    const isPass = res.success;
    const row = wsLog.addRow({
      id:      idx + 1,
      status:  res.status,
      latency: res.duration,
      outcome: isPass ? 'SUCCESS' : 'FAILURE'
    });

    const outcomeCell = row.getCell('outcome');
    outcomeCell.font = { bold: true, name: 'Calibri', size: 10, color: { argb: isPass ? COLORS.passedStatus : COLORS.fail } };
    outcomeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isPass ? COLORS.passedStatusLight : COLORS.failLight } };
    outcomeCell.alignment = { horizontal: 'center' };

    row.getCell('status').alignment = { horizontal: 'center' };
    row.getCell('latency').alignment = { horizontal: 'right' };

    if (idx % 2 === 1) {
      row.eachCell(c => {
        const key = c._column ? c._column.key : '';
        if (key !== 'outcome') {
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.rowAlt } };
        }
      });
    }

    applyBorder(row);
  });

  // Ensure output directory
  const reportsDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const filename = `Orin_Load_Test_Report_${timestamp}.xlsx`;
  const filePath = path.join(reportsDir, filename);

  await workbook.xlsx.writeFile(filePath);
  console.log(`\n✅ Load Test Excel Report generated: ${filePath}`);
}

runLoadTest().catch(err => {
  console.error(`Load test error:`, err);
  process.exit(1);
});
