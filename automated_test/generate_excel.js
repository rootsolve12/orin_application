const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// Colors
const COLORS = {
  headerBg: '2B579A', // Windows Excel Blue
  headerText: 'FFFFFF',
  criticalBg: 'FFC7CE',
  criticalText: '9C0006',
  highBg: 'FFEB9C',
  highText: '9C6500',
  mediumBg: 'FFF2CC',
  mediumText: 'B2A100',
  okBg: 'C6EFCE',
  okText: '006100',
  stripeBg: 'F2F2F2',
  white: 'FFFFFF',
  summaryBorder: 'D3D3D3'
};

async function generateExcel() {
  const reportPath = path.join(__dirname, 'report.json');
  const outputPath = path.join(__dirname, 'orin_dast_findings.xlsx');

  if (!fs.existsSync(reportPath)) {
    console.error(`Error: report.json not found at ${reportPath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(reportPath, 'utf8');
  const report = JSON.parse(rawData);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Orin DAST Agent';
  workbook.lastModifiedBy = 'Orin DAST Agent';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Create sheets
  createSummarySheet(workbook, report);
  createFindingsSheet(workbook, report);
  createAllTestsSheet(workbook, report);

  try {
    await workbook.xlsx.writeFile(outputPath);
    console.log(`Excel sheet successfully written to ${outputPath}`);
  } catch (err) {
    if (err.code === 'EBUSY') {
      const fallbackPath = path.join(__dirname, 'orin_dast_findings_fixed.xlsx');
      console.warn(`Warning: ${outputPath} is locked/busy. Writing to fallback path instead: ${fallbackPath}`);
      await workbook.xlsx.writeFile(fallbackPath);
      console.log(`Excel sheet successfully written to ${fallbackPath}`);
    } else {
      throw err;
    }
  }
}

function createSummarySheet(workbook, report) {
  const sheet = workbook.addWorksheet('Summary Dashboard', {
    views: [{ showGridLines: true }]
  });

  // Title Row
  sheet.mergeCells('A1:G2');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'ORIN API DAST SECURITY SCAN REPORT';
  titleCell.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: COLORS.headerText } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // Metadata block
  sheet.getCell('A4').value = 'Scan Target:';
  sheet.getCell('A4').font = { bold: true, name: 'Segoe UI' };
  sheet.getCell('B4').value = 'http://localhost:5000';
  sheet.getCell('B4').font = { name: 'Segoe UI' };

  sheet.getCell('A5').value = 'Scan Date:';
  sheet.getCell('A5').font = { bold: true, name: 'Segoe UI' };
  sheet.getCell('B5').value = new Date().toLocaleString();
  sheet.getCell('B5').font = { name: 'Segoe UI' };

  sheet.getCell('A6').value = 'Total Test Cases:';
  sheet.getCell('A6').font = { bold: true, name: 'Segoe UI' };
  sheet.getCell('B6').value = report.length;
  sheet.getCell('B6').font = { name: 'Segoe UI' };

  // Compute stats
  let totalFindings = 0;
  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let okCount = 0;

  const categoryStats = {};

  report.forEach(item => {
    const cat = item.test_category || 'other';
    if (!categoryStats[cat]) {
      categoryStats[cat] = { total: 0, findings: 0, critical: 0, high: 0, medium: 0, ok: 0 };
    }
    categoryStats[cat].total++;

    if (item.finding) {
      totalFindings++;
      categoryStats[cat].findings++;
      if (item.severity === 'CRITICAL') {
        criticalCount++;
        categoryStats[cat].critical++;
      } else if (item.severity === 'HIGH') {
        highCount++;
        categoryStats[cat].high++;
      } else if (item.severity === 'MEDIUM') {
        mediumCount++;
        categoryStats[cat].medium++;
      } else {
        okCount++;
        categoryStats[cat].ok++;
      }
    } else {
      okCount++;
      categoryStats[cat].ok++;
    }
  });

  // Severity metrics display cards (row 8 to 11)
  const cards = [
    { label: 'CRITICAL', count: criticalCount, bg: COLORS.criticalBg, text: COLORS.criticalText, colStart: 'A', colEnd: 'B' },
    { label: 'HIGH', count: highCount, bg: COLORS.highBg, text: COLORS.highText, colStart: 'C', colEnd: 'D' },
    { label: 'MEDIUM', count: mediumCount, bg: COLORS.mediumBg, text: COLORS.mediumText, colStart: 'E', colEnd: 'F' },
    { label: 'ALL FINDINGS', count: totalFindings, bg: 'D9E1F2', text: '1F497D', colStart: 'G', colEnd: 'H' }
  ];

  sheet.getCell('A8').value = 'Vulnerability Severity Summary';
  sheet.getCell('A8').font = { name: 'Segoe UI', size: 12, bold: true };

  cards.forEach(card => {
    const rLabel = 9;
    const rVal = 10;
    
    sheet.mergeCells(`${card.colStart}${rLabel}:${card.colEnd}${rLabel}`);
    sheet.mergeCells(`${card.colStart}${rVal}:${card.colEnd}${rVal}`);
    
    const labelCell = sheet.getCell(`${card.colStart}${rLabel}`);
    labelCell.value = card.label;
    labelCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: card.text } };
    labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: card.bg } };
    labelCell.alignment = { horizontal: 'center', vertical: 'middle' };
    labelCell.border = {
      top: { style: 'thin', color: { argb: COLORS.summaryBorder } },
      left: { style: 'thin', color: { argb: COLORS.summaryBorder } },
      right: { style: 'thin', color: { argb: COLORS.summaryBorder } }
    };

    const valCell = sheet.getCell(`${card.colStart}${rVal}`);
    valCell.value = card.count;
    valCell.font = { name: 'Segoe UI', size: 18, bold: true, color: { argb: card.text } };
    valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: card.bg } };
    valCell.alignment = { horizontal: 'center', vertical: 'middle' };
    valCell.border = {
      bottom: { style: 'thin', color: { argb: COLORS.summaryBorder } },
      left: { style: 'thin', color: { argb: COLORS.summaryBorder } },
      right: { style: 'thin', color: { argb: COLORS.summaryBorder } }
    };
  });

  // Table header for Category Breakdown
  sheet.getCell('A13').value = 'Test Category Breakdown';
  sheet.getCell('A13').font = { name: 'Segoe UI', size: 12, bold: true };

  const tableHeaders = ['Test Category', 'Total Tests', 'Findings Detected', 'Critical', 'High', 'Medium', 'Passed/OK'];
  const startRow = 14;

  tableHeaders.forEach((h, i) => {
    const cell = sheet.getCell(startRow, i + 1);
    cell.value = h;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: COLORS.headerText } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'medium', color: { argb: '000000' } },
      bottom: { style: 'medium', color: { argb: '000000' } }
    };
  });

  let currentRow = startRow + 1;
  const categories = Object.keys(categoryStats).sort();

  categories.forEach((cat, idx) => {
    const stats = categoryStats[cat];
    const rowValues = [
      formatCategoryName(cat),
      stats.total,
      stats.findings,
      stats.critical,
      stats.high,
      stats.medium,
      stats.ok
    ];

    rowValues.forEach((val, colIdx) => {
      const cell = sheet.getCell(currentRow, colIdx + 1);
      cell.value = val;
      cell.font = { name: 'Segoe UI', size: 10 };
      
      // Styling and alignment
      if (colIdx === 0) {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
        cell.font = { name: 'Segoe UI', size: 10, bold: true };
      } else {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }

      // Zebra striping
      if (idx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.stripeBg } };
      }

      // Cell border
      cell.border = {
        bottom: { style: 'thin', color: { argb: COLORS.summaryBorder } },
        left: { style: 'thin', color: { argb: COLORS.summaryBorder } },
        right: { style: 'thin', color: { argb: COLORS.summaryBorder } }
      };

      // Bold findings/critical counts
      if (colIdx === 2 && val > 0) {
        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: '9C0006' } };
      }
    });

    currentRow++;
  });

  // Add a total row
  const totalRowValues = ['Total', report.length, totalFindings, criticalCount, highCount, mediumCount, okCount];
  totalRowValues.forEach((val, colIdx) => {
    const cell = sheet.getCell(currentRow, colIdx + 1);
    cell.value = val;
    cell.font = { name: 'Segoe UI', size: 10, bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2EFDA' } }; // Light green total row
    cell.alignment = colIdx === 0 ? { horizontal: 'left' } : { horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'double', color: { argb: '000000' } }
    };
  });

  // Configure column widths
  sheet.columns = [
    { width: 30 }, // A
    { width: 15 }, // B
    { width: 18 }, // C
    { width: 12 }, // D
    { width: 12 }, // E
    { width: 12 }, // F
    { width: 15 }  // G
  ];
}

function createFindingsSheet(workbook, report) {
  const sheet = workbook.addWorksheet('Security Findings', {
    views: [{ showGridLines: true }]
  });

  // Title Header
  sheet.mergeCells('A1:J1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'DETAILED SECURITY FINDINGS (VULNERABILITIES ONLY)';
  titleCell.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: COLORS.headerText } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C00000' } }; // Red header
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(1).height = 30;

  const headers = ['#', 'Category', 'Severity', 'Method', 'Endpoint', 'Test Role', 'Status', 'Expected', 'Description / Note', 'Timestamp'];
  headers.forEach((h, i) => {
    const cell = sheet.getCell(2, i + 1);
    cell.value = h;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: COLORS.headerText } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });
  sheet.getRow(2).height = 24;

  const findings = report.filter(item => item.finding);
  
  // Sort findings: CRITICAL -> HIGH -> MEDIUM
  const severityOrder = { 'CRITICAL': 1, 'HIGH': 2, 'MEDIUM': 3 };
  findings.sort((a, b) => {
    const orderA = severityOrder[a.severity] || 99;
    const orderB = severityOrder[b.severity] || 99;
    if (orderA !== orderB) return orderA - orderB;
    return a.test_category.localeCompare(b.test_category) || a.endpoint.localeCompare(b.endpoint);
  });

  let rowIdx = 3;
  findings.forEach((item, idx) => {
    const rowValues = [
      idx + 1,
      formatCategoryName(item.test_category),
      item.severity,
      item.method,
      item.endpoint,
      item.role,
      item.status,
      item.expected_status,
      item.note,
      item.timestamp
    ];

    rowValues.forEach((val, colIdx) => {
      const cell = sheet.getCell(rowIdx, colIdx + 1);
      cell.value = val;
      cell.font = { name: 'Segoe UI', size: 10 };
      
      // Standard borders
      cell.border = {
        bottom: { style: 'thin', color: { argb: COLORS.summaryBorder } },
        left: { style: 'thin', color: { argb: COLORS.summaryBorder } },
        right: { style: 'thin', color: { argb: COLORS.summaryBorder } }
      };

      // Alignment
      if (colIdx === 0 || colIdx === 2 || colIdx === 3 || colIdx === 6 || colIdx === 7) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }

      // Severity Color Coding
      if (colIdx === 2) {
        let bg, text;
        if (val === 'CRITICAL') { bg = COLORS.criticalBg; text = COLORS.criticalText; }
        else if (val === 'HIGH') { bg = COLORS.highBg; text = COLORS.highText; }
        else if (val === 'MEDIUM') { bg = COLORS.mediumBg; text = COLORS.mediumText; }
        else { bg = COLORS.okBg; text = COLORS.okText; }

        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: text } };
      } else {
        // Zebra striping for other columns
        if (idx % 2 === 1) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.stripeBg } };
        }
      }
    });

    rowIdx++;
  });

  // Column widths
  sheet.columns = [
    { width: 6 },   // #
    { width: 22 },  // Category
    { width: 15 },  // Severity
    { width: 10 },  // Method
    { width: 38 },  // Endpoint
    { width: 22 },  // Test Role
    { width: 10 },  // Status
    { width: 10 },  // Expected
    { width: 65 },  // Note
    { width: 26 }   // Timestamp
  ];
}

function createAllTestsSheet(workbook, report) {
  const sheet = workbook.addWorksheet('All DAST Test Cases', {
    views: [{ showGridLines: true }]
  });

  // Title Header
  sheet.mergeCells('A1:K1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'ALL DAST TEST CASES RUN (PASS & FAIL)';
  titleCell.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: COLORS.headerText } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: COLORS.headerBg };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(1).height = 30;

  const headers = ['#', 'Category', 'Severity', 'Method', 'Endpoint', 'Test Role', 'Status', 'Expected', 'Finding?', 'Description / Note', 'Timestamp'];
  headers.forEach((h, i) => {
    const cell = sheet.getCell(2, i + 1);
    cell.value = h;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: COLORS.headerText } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: COLORS.headerBg };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });
  sheet.getRow(2).height = 24;

  let rowIdx = 3;
  report.forEach((item, idx) => {
    const rowValues = [
      idx + 1,
      formatCategoryName(item.test_category),
      item.severity,
      item.method,
      item.endpoint,
      item.role,
      item.status,
      item.expected_status,
      item.finding ? 'YES' : 'NO',
      item.note,
      item.timestamp
    ];

    rowValues.forEach((val, colIdx) => {
      const cell = sheet.getCell(rowIdx, colIdx + 1);
      cell.value = val;
      cell.font = { name: 'Segoe UI', size: 10 };
      
      // Standard borders
      cell.border = {
        bottom: { style: 'thin', color: { argb: COLORS.summaryBorder } },
        left: { style: 'thin', color: { argb: COLORS.summaryBorder } },
        right: { style: 'thin', color: { argb: COLORS.summaryBorder } }
      };

      // Alignment
      if (colIdx === 0 || colIdx === 2 || colIdx === 3 || colIdx === 6 || colIdx === 7 || colIdx === 8) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }

      // Formatting for Finding Column
      if (colIdx === 8) {
        if (val === 'YES') {
          cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: '9C0006' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.criticalBg } };
        } else {
          cell.font = { name: 'Segoe UI', size: 10, color: { argb: '006100' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.okBg } };
        }
      } else if (colIdx === 2) {
        // Severity coloring
        let bg, text;
        if (val === 'CRITICAL') { bg = COLORS.criticalBg; text = COLORS.criticalText; }
        else if (val === 'HIGH') { bg = COLORS.highBg; text = COLORS.highText; }
        else if (val === 'MEDIUM') { bg = COLORS.mediumBg; text = COLORS.mediumText; }
        else { bg = COLORS.okBg; text = COLORS.okText; }

        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: text } };
      } else {
        // Zebra striping for other columns
        if (idx % 2 === 1) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.stripeBg } };
        }
      }
    });

    rowIdx++;
  });

  // Column widths
  sheet.columns = [
    { width: 6 },   // #
    { width: 22 },  // Category
    { width: 15 },  // Severity
    { width: 10 },  // Method
    { width: 38 },  // Endpoint
    { width: 22 },  // Test Role
    { width: 10 },  // Status
    { width: 10 },  // Expected
    { width: 12 },  // Finding?
    { width: 65 },  // Note
    { width: 26 }   // Timestamp
  ];
}

function formatCategoryName(cat) {
  if (!cat) return '';
  return cat.split('_')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
}

generateExcel().catch(err => {
  console.error('Failed to generate excel file:', err);
  process.exit(1);
});
