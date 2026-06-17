const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

async function generateReport(results) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Orin E2E Tests';
  workbook.created = new Date();

  // Create Summary Sheet
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 25 },
    { header: 'Value', key: 'value', width: 15 },
  ];

  const totalTests = results.length;
  const passed = results.filter(r => r.status === 'passed').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const passRate = totalTests > 0 ? ((passed / totalTests) * 100).toFixed(2) : 0;
  const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);

  summarySheet.addRows([
    { metric: 'Total Tests Executed', value: totalTests },
    { metric: 'Passed', value: passed },
    { metric: 'Failed', value: failed },
    { metric: 'Pass Rate (%)', value: `${passRate}%` },
    { metric: 'Total Time (ms)', value: totalDuration },
    { metric: 'Execution Date', value: new Date().toLocaleString() },
  ]);

  // Style Summary Header
  summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7B61FF' } };

  // Create Details Sheet
  const detailsSheet = workbook.addWorksheet('Test Details');
  detailsSheet.columns = [
    { header: 'Test ID', key: 'id', width: 10 },
    { header: 'Test Name', key: 'name', width: 45 },
    { header: 'Functionality / Description', key: 'description', width: 60 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Duration (ms)', key: 'duration', width: 15 },
    { header: 'Error Trace', key: 'error', width: 50 },
  ];

  detailsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  detailsSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7B61FF' } };

  results.forEach((test, index) => {
    const row = detailsSheet.addRow({
      id: `TC-${index + 1}`,
      name: test.title,
      description: test.description || 'Validates core functionality of the module.',
      status: test.status ? test.status.toUpperCase() : 'UNKNOWN',
      duration: test.duration || 0,
      error: test.err ? test.err.message : 'N/A'
    });

    // Color code status
    const statusCell = row.getCell('status');
    statusCell.font = { bold: true, color: { argb: test.status === 'passed' ? 'FF00B050' : 'FFFF0000' } };
    
    // Make text wrap for descriptions
    row.getCell('description').alignment = { wrapText: true };
    row.getCell('name').alignment = { wrapText: true };
  });

  // Ensure reports directory exists
  const reportsDir = path.join(__dirname, '..', 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(reportsDir, `Test_Analysis_${timestamp}.xlsx`);

  await workbook.xlsx.writeFile(filePath);
  console.log(`\n✅ Excel Report successfully generated at: ${filePath}\n`);
}

module.exports = { generateReport };
