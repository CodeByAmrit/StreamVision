const PDFDocument = require('pdfkit-table');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

/**
 * ReportGenerator
 * Renders professional PDF reports from monitoring data
 */
class ReportGenerator {
    constructor() {
        this.logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png');
    }

    /**
     * Generate the PDF report
     * @param {Object} data Metrics and logs metadata
     * @param {String} timeframe (e.g. Last 30 Days)
     */
    async generate(data, timeframe = 'Last 30 Days') {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50, size: 'A4' });
                const buffers = [];
                
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => resolve(Buffer.concat(buffers)));

                // --- 1. Header & Branding ---
                if (fs.existsSync(this.logoPath)) {
                    doc.image(this.logoPath, 50, 45, { width: 40 });
                }
                
                doc.fillColor('#1e40af')
                   .fontSize(20)
                   .font('Helvetica-Bold')
                   .text('StreamVision Analytics', 100, 50);
                
                doc.fillColor('#6b7280')
                   .fontSize(10)
                   .font('Helvetica')
                   .text('Automated Infrastructure Report', 100, 72);

                doc.fontSize(10)
                   .text(`Generated: ${new Date().toLocaleString()}`, 400, 50, { align: 'right' });
                doc.text(`Period: ${timeframe}`, 400, 65, { align: 'right' });

                doc.moveTo(50, 95).lineTo(545, 95).stroke('#e5e7eb');

                // --- 2. Executive Summary ---
                doc.moveDown(2);
                doc.fillColor('#111827')
                   .fontSize(16)
                   .font('Helvetica-Bold')
                   .text('Executive Summary', 50, 115);

                const summaryTable = {
                    title: "Key Performance Indicators",
                    headers: ["Metric", "Monthly Average / Total", "Status"],
                    rows: [
                        ["System CPU Load", `${data.avgCpu}%`, data.avgCpu < 80 ? "Healthy" : "Critical"],
                        ["Memory Allocation", `${data.avgRam}%`, data.avgRam < 90 ? "Stable" : "High"],
                        ["Traffic Volume", `${data.totalRequests.toLocaleString()} Requests`, "Active"],
                        ["Gateway Error Rate", `${data.errorRate}%`, data.errorRate < 1 ? "Optimal" : "Check Logs"],
                        ["Critical Event Count", `${data.criticalErrors}`, data.healthStatus]
                    ]
                };

                doc.table(summaryTable, {
                    prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
                    prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                        doc.font('Helvetica').fontSize(10);
                        indexColumn === 0 && doc.addBackground(rectRow, '#f9fafb', 0.5);
                    },
                });

                // --- 3. Log Analytics ---
                doc.moveDown(2);
                doc.fillColor('#111827')
                   .fontSize(16)
                   .font('Helvetica-Bold')
                   .text('Log Repository Insights');

                doc.font('Helvetica').fontSize(11).fillColor('#4b5563');
                doc.text(`Analysis of service logs from the Loki repository identified ${data.criticalErrors} event signatures matching the "error" level within the ${timeframe} scope.`);
                
                if (data.criticalErrors > 100) {
                    doc.fillColor('#dc2626').text('Recommendation: Review container orchestration stability and upstream HLS connectivity.');
                } else {
                    doc.fillColor('#059669').text('Infrastructure stability remains within nominal enterprise parameters.');
                }

                // --- 4. Footer ---
                const range = doc.bufferedPageRange();
                for (let i = range.start; i < range.start + range.count; i++) {
                    doc.switchToPage(i);
                    doc.fontSize(8).fillColor('#9ca3af')
                       .text(`StreamVision Enterprise Reporting Engine | Page ${i + 1} of ${range.count}`, 
                       50, 780, { align: 'center', width: 500 });
                }

                doc.end();

            } catch (error) {
                logger.error(`PDF Generation failed: ${error.message}`);
                reject(error);
            }
        });
    }
}

module.exports = new ReportGenerator();
