const PDFDocument = require("pdfkit-table");
const fs = require("fs");
const path = require("path");
const logger = require("./logger");

class ReportGenerator {
  constructor() {
    this.logoPath = path.join(process.cwd(), "public", "images", "netwon.svg");
  }

  drawCard(doc, x, y, title, value, status, color) {
    doc.roundedRect(x, y, 120, 70, 8).fillAndStroke("#f9fafb", "#e5e7eb");
    doc
      .fillColor("#6b7280")
      .fontSize(9)
      .font("Helvetica")
      .text(title, x + 10, y + 10, { width: 100 });
    doc
      .fillColor("#111827")
      .fontSize(16)
      .font("Helvetica-Bold")
      .text(value, x + 10, y + 28, { width: 100 });
    doc
      .fillColor(color)
      .fontSize(9)
      .font("Helvetica-Bold")
      .text(status, x + 10, y + 50, { width: 100 });
  }

  drawSignatures(doc, y) {
    const lineLength = 180;
    const startY = y + 40;

    doc
      .moveTo(50, startY)
      .lineTo(50 + lineLength, startY)
      .stroke("#111827");
    doc
      .fillColor("#111827")
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Amrit", 50, startY + 10);
    doc
      .fillColor("#6b7280")
      .fontSize(9)
      .font("Helvetica")
      .text("Tech Leader", 50, startY + 22);

    doc
      .moveTo(365, startY)
      .lineTo(365 + lineLength, startY)
      .stroke("#111827");
    doc
      .fillColor("#111827")
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Netwonteam", 365, startY + 10);
    doc
      .fillColor("#6b7280")
      .fontSize(9)
      .font("Helvetica")
      .text("Company Head", 365, startY + 22);
  }

  async generate(data, timeframe = "Last 30 Days") {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: "A4" });
        const buffers = [];

        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => resolve(Buffer.concat(buffers)));

        // ===== HEADER =====
        doc
          .save()
          .translate(50, 40)
          .scale(0.05)
          .fillColor("#1e40af")
          .path(
            "M351.344 0C392.969 14.8157 524.053 56.2997 698.455 103.71C713.271 421.19 658.241 541.832 571.463 639.192C502.191 716.912 394.142 765.971 349.516 780.902V781C349.468 780.984 349.42 780.967 349.371 780.951C349.323 780.967 349.276 780.984 349.228 781V780.902C304.611 765.971 198.669 716.913 129.397 639.192C42.6191 541.832 -12.4111 421.189 2.4046 103.71C176.806 56.2998 309.719 14.8158 351.344 0Z"
          )
          .fill()
          .restore();

        doc
          .fillColor("#1e40af")
          .fontSize(22)
          .font("Helvetica-Bold")
          .text("StreamVision Analytics", 100, 45);

        doc
          .fillColor("#6b7280")
          .fontSize(10)
          .font("Helvetica")
          .text("Performance & Infrastructure Audit Report", 100, 68);

        doc
          .fontSize(9)
          .text(`Report ID: SV-${Date.now().toString().slice(-6)}`, 400, 45, { align: "right" });
        doc.text(`Period: ${timeframe}`, 400, 58, { align: "right" });
        doc.text(`Generated: ${new Date().toLocaleString()}`, 400, 71, { align: "right" });

        doc.moveTo(50, 95).lineTo(545, 95).stroke("#e5e7eb");

        // ===== CARDS =====
        const avgCpu = parseFloat(data.avgCpu || 0);
        const avgRam = parseFloat(data.avgRam || 0);
        const errorRate = parseFloat(data.errorRate || 0);

        this.drawCard(
          doc,
          50,
          110,
          "Average CPU Load",
          `${avgCpu}%`,
          avgCpu < 80 ? "Optimized" : "Heat Alert",
          "#22c55e"
        );
        this.drawCard(
          doc,
          190,
          110,
          "Memory Threshold",
          `${avgRam}%`,
          avgRam < 90 ? "Stable" : "High Usage",
          "#22c55e"
        );
        this.drawCard(
          doc,
          330,
          110,
          "Network Throughput",
          `${data.totalRequests || 0}`,
          "Requests",
          "#3b82f6"
        );
        this.drawCard(
          doc,
          470,
          110,
          "Critical Failures",
          `${errorRate}%`,
          errorRate < 1 ? "SLA Target Met" : "Requires Audit",
          "#ef4444"
        );

        // 🔥 IMPORTANT: RESET FLOW AFTER ABSOLUTE POSITIONING
        doc.y = 200;
        doc.x = 50;

        // ===== TABLE =====
        const servicesTable = {
          title: "Infrastructure Stability Matrix",
          subtitle: "Comprehensive health check of core streaming and gateway services",
          headers: [
            { label: "Service Identifier", width: 130 },
            { label: "Status", width: 70 },
            { label: "Performance Metadata", width: 260 },
          ],
          rows: (data.services || []).map((s) => [s.name, s.status.toUpperCase(), s.details]),
        };

        await doc.table(servicesTable, {
          x: 50,
          width: 495,
          prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10).fillColor("#111827"),
          prepareRow: (row, i) => {
            doc.font("Helvetica").fontSize(9).fillColor("#374151");
            if (i % 2 === 0) doc.addBackground([50, doc.y, 495, 20], "#f9fafb");
          },
        });

        // 🔥 RESET AGAIN AFTER TABLE
        doc.moveDown(1);
        doc.x = 50;

        // ===== LOG SECTION =====
        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .fillColor("#111827")
          .text("Telemetry & Log Analysis", { width: 495 });

        doc.moveDown(0.5);

        doc
          .fontSize(10)
          .font("Helvetica")
          .fillColor("#4b5563")
          .text(
            `Our Loki-powered log inspection engine detected ${data.criticalErrors || 0} event signatures matching critical error patterns during this reporting cycle.`,
            { width: 495 }
          );

        if (data.alerts && data.alerts.length > 0) {
          doc.moveDown(0.5);
          data.alerts.forEach((alert) => {
            doc.fillColor("#d97706").text(`● ANOMALY DETECTED: ${alert}`, { width: 495 });
          });
        } else {
          doc.moveDown(0.5);
          doc
            .fillColor("#059669")
            .text("● VERDICT: Infrastructure operating within nominal professional parameters.", {
              width: 495,
            });
        }

        // ===== ADMIN =====
        doc.moveDown(2);
        doc.x = 50;

        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .fillColor("#111827")
          .text("Administrative Validation", { width: 495 });

        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor("#6b7280")
          .text(
            "This report is electronically generated and requires manual validation by the designated authorities.",
            { width: 495 }
          );

        this.drawSignatures(doc, doc.y);

        // ===== FOOTER =====
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
          doc.switchToPage(i);
          doc
            .fontSize(8)
            .fillColor("#9ca3af")
            .text(
              `StreamVision High-Performance Analytics | Proprietary & Confidential | Page ${i + 1}`,
              50,
              795,
              { align: "center", width: 495 }
            );
        }

        doc.end();
      } catch (err) {
        logger.error(err);
        reject(err);
      }
    });
  }
}

module.exports = new ReportGenerator();
