/**
 * Orin E2E Framework - Excel Report Generator
 * Generates styled multi-sheet Excel workbooks with test results,
 * summary statistics, browser/environment metadata, and failure traces.
 */
'use strict';

const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const config = require('../config/framework.config');
const logger = require('./logger');

// ─── Color Palette ────────────────────────────────────────────────────────────
const COLORS = {
  brandPurple:  'FF7B61FF',
  brandPurpleLight: 'FFD4CCFF',
  headerText:   'FFFFFFFF',
  passedStatus: 'FF00B050',
  passedStatusLight: 'FFE2FFEC',
  fail:         'FFFF0000',
  failLight:    'FFFFEBEE',
  skip:         'FFFF8C00',
  skipLight:    'FFFFF3E0',
  pending:      'FF2196F3',
  pendingLight: 'FFE3F2FD',
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

function statusStyle(status) {
  switch ((status || '').toLowerCase()) {
    case 'passed':  return { color: COLORS.passedStatus,    bg: COLORS.passedStatusLight };
    case 'failed':  return { color: COLORS.fail,    bg: COLORS.failLight };
    case 'pending': return { color: COLORS.pending, bg: COLORS.pendingLight };
    default:        return { color: COLORS.skip,    bg: COLORS.skipLight };
  }
}

/**
 * Build the Summary sheet.
 */
function buildSummarySheet(workbook, results, metadata) {
  const ws = workbook.addWorksheet('📊 Summary', {
    properties: { tabColor: { argb: COLORS.brandPurple } },
  });

  const passed  = results.filter(r => r.status === 'passed').length;
  const failed  = results.filter(r => r.status === 'failed').length;
  const pending = results.filter(r => r.status === 'pending').length;
  const total   = results.length;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(2) : '0.00';
  const totalDuration = results.reduce((s, r) => s + (r.duration || 0), 0);

  // Title Row
  ws.mergeCells('A1:D1');
  const titleCell = ws.getCell('A1');
  titleCell.value = '🟣 Orin Application — End-to-End Test Report';
  titleCell.font = { bold: true, size: 16, name: 'Calibri', color: { argb: COLORS.brandPurple } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 40;

  ws.addRow([]);

  // Section: Execution Summary
  const sectionRow = ws.addRow(['Execution Summary']);
  sectionRow.getCell(1).font = { bold: true, size: 12, color: { argb: COLORS.brandPurple }, name: 'Calibri' };
  ws.addRow([]);

  const summaryData = [
    ['Total Tests Executed', total],
    ['✅ Passed',            passed],
    ['❌ Failed',            failed],
    ['⏳ Pending / Skipped', pending],
    ['📈 Pass Rate',         `${passRate}%`],
    ['⏱  Total Duration',    `${(totalDuration / 1000).toFixed(2)}s`],
    ['🗓  Execution Date',    new Date().toLocaleString()],
    ['🌐 Browser',           metadata.browser || config.browser.default],
    ['🖥️  Environment',      metadata.environment || 'Local'],
    ['📦 App URL',           metadata.baseUrl || config.baseUrl],
  ];

  summaryData.forEach(([metric, value], i) => {
    const row = ws.addRow([metric, value]);
    row.getCell(1).font = { bold: true, ...BODY_FONT, color: { argb: COLORS.darkText } };
    row.getCell(2).font = { ...BODY_FONT };
    if (i % 2 === 0) {
      row.eachCell(c => {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.rowAlt } };
      });
    }
    applyBorder(row);
  });

  ws.getColumn(1).width = 30;
  ws.getColumn(2).width = 40;

  // Mini Donut Note
  ws.addRow([]);
  const noteRow = ws.addRow([`Pass Rate: ${passRate}% — ${passed} passed, ${failed} failed out of ${total} total`]);
  noteRow.getCell(1).font = { italic: true, color: { argb: COLORS.mutedText }, name: 'Calibri', size: 10 };
  ws.mergeCells(`A${noteRow.number}:D${noteRow.number}`);
}

/**
 * Build the Test Details sheet.
 */
function buildDetailsSheet(workbook, results) {
  const ws = workbook.addWorksheet('📋 Test Details', {
    properties: { tabColor: { argb: 'FF00B050' } },
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  ws.columns = [
    { header: 'TC ID',             key: 'id',          width: 10 },
    { header: 'Suite',             key: 'suite',        width: 22 },
    { header: 'Test Name',         key: 'name',         width: 55 },
    { header: 'Status',            key: 'status',       width: 12 },
    { header: 'Duration (ms)',     key: 'duration',     width: 15 },
    { header: 'Screenshot',        key: 'screenshot',   width: 40 },
    { header: 'Error / Details',   key: 'error',        width: 60 },
  ];

  // Style header row
  const headerRow = ws.getRow(1);
  headerRow.font = HEADER_FONT;
  headerRow.fill = HEADER_FILL;
  headerRow.height = 28;
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  applyBorder(headerRow);

  results.forEach((test, index) => {
    const { color, bg } = statusStyle(test.status);
    const row = ws.addRow({
      id:         `TC-${String(index + 1).padStart(3, '0')}`,
      suite:      test.suite || 'General',
      name:       test.title,
      status:     (test.status || 'unknown').toUpperCase(),
      duration:   test.duration || 0,
      screenshot: test.screenshotPath
        ? path.basename(test.screenshotPath)
        : 'N/A',
      error:      test.err
        ? (test.err.message || String(test.err)).substring(0, 300)
        : 'N/A',
    });

    // Status cell styling
    const statusCell = row.getCell('status');
    statusCell.font   = { bold: true, color: { argb: color }, name: 'Calibri', size: 10 };
    statusCell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
    statusCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Alternate row fill
    if (index % 2 === 1) {
      row.eachCell(c => {
        if (!['status'].includes(c._column ? c._column.key : '')) {
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.rowAlt } };
        }
      });
    }

    row.getCell('name').alignment  = { wrapText: true, vertical: 'middle' };
    row.getCell('error').alignment = { wrapText: true, vertical: 'middle' };
    row.height = 35;

    applyBorder(row);
  });
}

/**
 * Build the Failures sheet (only failed tests).
 */
function buildFailuresSheet(workbook, results) {
  const failures = results.filter(r => r.status === 'failed');
  if (failures.length === 0) return;

  const ws = workbook.addWorksheet('❌ Failures', {
    properties: { tabColor: { argb: COLORS.fail } },
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  ws.columns = [
    { header: 'TC ID',           key: 'id',       width: 10 },
    { header: 'Suite',           key: 'suite',     width: 22 },
    { header: 'Test Name',       key: 'name',      width: 55 },
    { header: 'Error Message',   key: 'error',     width: 65 },
    { header: 'Stack Trace',     key: 'stack',     width: 70 },
    { header: 'Screenshot File', key: 'shot',      width: 45 },
  ];

  const headerRow = ws.getRow(1);
  headerRow.font = HEADER_FONT;
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCC0000' } };
  headerRow.height = 28;
  applyBorder(headerRow);

  failures.forEach((test, index) => {
    const row = ws.addRow({
      id:    `TC-${String(results.indexOf(test) + 1).padStart(3, '0')}`,
      suite: test.suite || 'General',
      name:  test.title,
      error: test.err ? (test.err.message || String(test.err)).substring(0, 300) : 'N/A',
      stack: test.err && test.err.stack ? test.err.stack.substring(0, 400) : 'N/A',
      shot:  test.screenshotPath ? path.basename(test.screenshotPath) : 'N/A',
    });

    row.eachCell(c => {
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.failLight } };
    });
    row.getCell('name').alignment  = { wrapText: true };
    row.getCell('error').alignment = { wrapText: true };
    row.getCell('stack').alignment = { wrapText: true };
    row.height = 50;
    applyBorder(row);
  });
}

/**
 * Main report generator function — call this at the end of the test suite.
 * @param {Array}  results  - Array of test result objects
 * @param {Object} metadata - { browser, environment, baseUrl }
 * @returns {Promise<string>} Path to the generated Excel file
 */
async function generateReport(results = [], metadata = {}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Orin E2E Framework';
  workbook.lastModifiedBy = 'Antigravity Agent';
  workbook.created = new Date();
  workbook.modified = new Date();

  buildSummarySheet(workbook, results, metadata);
  buildDetailsSheet(workbook, results);
  buildFailuresSheet(workbook, results);

  // Ensure output directory
  const reportsDir = config.reports.outputDir;
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const filename = `${config.reports.excelFilename}_${timestamp}.xlsx`;
  const filePath = path.join(reportsDir, filename);

  await workbook.xlsx.writeFile(filePath);
  logger.info(`\n✅ Excel Report generated: ${filePath}`);
  return filePath;
}

module.exports = { generateReport };
