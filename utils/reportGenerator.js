const PDFDocument = require("pdfkit-table");
const fs = require("fs");
const path = require("path");
const logger = require("./logger");

/**
 * ReportGenerator
 * Generates an enterprise-grade performance and infrastructure PDF audit report.
 */
class ReportGenerator {
  constructor() {
    this.logoPath = path.join(process.cwd(), "public", "images", "netwon.svg");
  }

  /**
   * Helper: Draw a single metric card (Refined Professional Design)
   * @param {Object} doc PDFDocument
   * @param {Number} x X-coordinate
   * @param {Number} y Y-coordinate
   * @param {String} title Metric title (e.g. CPU Load)
   * @param {String} value Primary metric value (e.g. 75.3%)
   * @param {String} subtitle Contextual description
   * @param {String} color Accent color (e.g. #3b82f6)
   */
  drawCard(doc, x, y, title, value, subtitle, color) {
    const cardWidth = 242; // Adjusted to fill the width (total 495 - gap 11 ≈ 242)
    const cardHeight = 82;
    const borderRadius = 8;
    const safeX = x || 50;
    const safeY = y || 110;

    // Card background & border
    doc
      .roundedRect(safeX, safeY, cardWidth, cardHeight, borderRadius)
      .fillAndStroke("#ffffff", "#f3f4f6");

    // Decorative side-accent (Modern bar on the left)
    doc
      .roundedRect(safeX, safeY, 4, cardHeight, {
        topLeft: 8,
        bottomLeft: 8,
        topRight: 0,
        bottomRight: 0,
      })
      .fill(color);

    doc
      .fillColor("#4b5563")
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(title, safeX + 16, safeY + 14, { width: cardWidth - 32 });

    doc
      .fillColor("#111827")
      .fontSize(22)
      .font("Helvetica-Bold")
      .text(value, safeX + 16, safeY + 32, { width: cardWidth - 32 });

    doc
      .fillColor("#9ca3af")
      .fontSize(8.5)
      .font("Helvetica")
      .text(subtitle, safeX + 16, safeY + 60, { width: cardWidth - 32 });
  }

  /**
   * Helper: Draw signatures with lines
   * @param {Object} doc PDFDocument
   * @param {Number} y Baseline Y-coordinate
   */
  drawSignatures(doc, y) {
    const lineLength = 190;
    const currentY = y || doc.y || 500;
    const startY = currentY + 45;

    // Left signature (Tech Leader)
    doc
      .moveTo(50, startY)
      .lineTo(50 + lineLength, startY)
      .lineWidth(0.5)
      .stroke("#d1d5db");
    doc
      .fillColor("#111827")
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Amrit Sharma", 50, startY + 10);
    doc
      .fillColor("#6b7280")
      .fontSize(8)
      .font("Helvetica")
      .text("Technical Lead & Founder", 50, startY + 22);

    // Right signature (Company Head)
    doc
      .moveTo(355, startY)
      .lineTo(355 + lineLength, startY)
      .lineWidth(0.5)
      .stroke("#d1d5db");
    doc
      .fillColor("#111827")
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Newtonteam Authority", 355, startY + 10);
    doc
      .fillColor("#6b7280")
      .fontSize(8)
      .font("Helvetica")
      .text("Executive Oversight", 355, startY + 22);
  }

  /**
   * Main Generator
   * @param {Object} data Telemetry data from MonitoringClient
   * @param {String} timeframe Selected period string
   */
  async generate(data, timeframe = "Last 30 Days") {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: "A4" });
        const buffers = [];

        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => resolve(Buffer.concat(buffers)));

        // -------------------- HEADER & BRANDING --------------------
        // We draw the corporate logo path directly with blue fill (#1e40af)
        doc.save();
        doc
          .translate(50, 40)
          .scale(0.04)
          .fillColor("#1e40af")
          .path(
            "M351.344 0C392.969 14.8157 524.053 56.2997 698.455 103.71C713.271 421.19 658.241 541.832 571.463 639.192C502.191 716.912 394.142 765.971 349.516 780.902V781C349.468 780.984 349.42 780.967 349.371 780.951C349.323 780.967 349.276 780.984 349.228 781V780.902C304.611 765.971 198.669 716.913 129.397 639.192C42.6191 541.832 -12.4111 421.189 2.4046 103.71C176.806 56.2998 309.719 14.8158 351.344 0Z"
          )
          .fill();
        doc.restore();

        doc
          .fillColor("#1e40af")
          .fontSize(22)
          .font("Helvetica-Bold")
          .text("StreamVision Analytics", 110, 45);

        doc
          .fillColor("#4b5563")
          .fontSize(10)
          .font("Helvetica")
          .text("Cloud Infrastructure & Streaming Performance Audit", 110, 68);

        // Right side metadata
        doc
          .fontSize(8.5)
          .fillColor("#9ca3af")
          .text(`Report ID: SV-${Date.now().toString().slice(-6)}`, 400, 45, { align: "right" })
          .text(`Period: ${timeframe}`, 400, 56, { align: "right" })
          .text(`System Time: ${new Date().toLocaleString()}`, 400, 67, { align: "right" });

        doc.moveTo(50, 95).lineTo(545, 95).lineWidth(0.5).stroke("#e5e7eb");

        // -------------------- KPI CARD GRID (2x2) --------------------
        const avgCpu = parseFloat(data.avgCpu || 0);
        const avgRam = parseFloat(data.avgRam || 0);
        const errorRate = parseFloat(data.errorRate || 0);
        const totalReq = data.totalRequests || 0;

        const cardX1 = 50;
        const cardX2 = 303; // gap of 11
        const row1Y = 110;
        const row2Y = 110 + 92;

        this.drawCard(
          doc,
          cardX1,
          row1Y,
          "Server CPU Load",
          `${avgCpu}%`,
          avgCpu < 80 ? "Nominal performance" : "Critical load surge",
          "#3b82f6"
        );
        this.drawCard(
          doc,
          cardX2,
          row1Y,
          "Memory Utilization",
          `${avgRam}%`,
          avgRam < 90 ? "Healthy headroom" : "Capacity alert triggered",
          "#8b5cf6"
        );
        this.drawCard(
          doc,
          cardX1,
          row2Y,
          "Cumulative Traffic",
          totalReq.toLocaleString(),
          "Total requests processed",
          "#10b981"
        );
        this.drawCard(
          doc,
          cardX2,
          row2Y,
          "Global Error Rate",
          `${errorRate}%`,
          errorRate < 1 ? "Within SLA targets" : "Requires urgent audit",
          "#ef4444"
        );

        // Reset flow for subsequent elements
        doc.y = row2Y + 105;

        // -------------------- STABILITY MATRIX (TABLE) --------------------
        const servicesTable = {
          title: "Infrastructure Stability Matrix",
          subtitle: "Granular status and telemetry for mission-critical core services",
          headers: [
            { label: "Service Identifier", width: 140, align: "left" },
            { label: "Status", width: 80, align: "center" },
            { label: "Performance Statistics", width: 275, align: "left" },
          ],
          rows: (data.services || []).map((s) => [
            s.name || "Unknown",
            { label: (s.status || "UNKNOWN").toUpperCase(), align: "center" },
            s.details || "No telemetry available",
          ]),
        };

        // Note: Using safer callbacks to prevent 'undefined property' errors in different pdfkit-table versions
        await doc.table(servicesTable, {
          x: 50,
          width: 495,
          prepareHeader: (header, index, rect) => {
            // Defensive check for rect to avoid 'Cannot read x of undefined'
            if (rect) {
              doc.rect(rect.x, rect.y, rect.w, rect.h).fill("#1e40af");
            }
            doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10);
            return header;
          },
          prepareRow: (row, indexColumn, indexRow, rectRow) => {
            doc.font("Helvetica").fontSize(9).fillColor("#374151");
            // Standard zebra striping using the provided rectRow object
            if (indexRow % 2 === 0 && rectRow) {
              doc.addBackground(rectRow, "#f9fafb", 0.6);
            }
            return row;
          },
        });

        doc.moveDown(1.5);

        // -------------------- TELEMETRY ANALYSIS --------------------
        doc
          .fontSize(13)
          .font("Helvetica-Bold")
          .fillColor("#111827")
          .text("Telemetry & Cluster Analysis", { width: 495 });

        doc.moveDown(0.5);

        doc
          .fontSize(10)
          .font("Helvetica")
          .fillColor("#4b5563")
          .lineGap(3)
          .text(
            `Automated log forensics via Loki detected ${data.criticalErrors || 0} critical event signatures. The anomaly engine has analyzed the data stream for the requested timeframe (${timeframe}).`,
            { width: 495 }
          );

        if (data.alerts && data.alerts.length > 0) {
          doc.moveDown(0.8);
          doc
            .fillColor("#d97706")
            .font("Helvetica-Bold")
            .text("Detected Operational Anomalies:", { underline: true });
          doc.moveDown(0.3).font("Helvetica");
          data.alerts.forEach((alert) => {
            doc.text(`\u2022 ${alert}`, { width: 495, indent: 10 });
          });
        } else {
          doc.moveDown(0.8);
          doc
            .fillColor("#059669")
            .font("Helvetica-Bold")
            .text(
              "\u2714 No anomalies detected. System operating within nominal professional parameters.",
              {
                width: 495,
              }
            );
        }

        // -------------------- VALIDATION & SIGNATURES --------------------
        doc.moveDown(2.5);
        doc
          .fontSize(13)
          .font("Helvetica-Bold")
          .fillColor("#111827")
          .text("Administrative Validation", { width: 495 });

        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor("#6b7280")
          .text(
            "This report is an internal system audit generated automatically. Any identified deviations from the SLA should be cross-referenced with the Grafana enterprise dashboards.",
            { width: 495, lineGap: 2 }
          );

        this.drawSignatures(doc, doc.y);

        // -------------------- FOOTER (STICKY) --------------------
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
          doc.switchToPage(i);
          doc
            .fontSize(8)
            .fillColor("#d1d5db")
            .text(
              `StreamVision Enterprise Analytics | Confidential Auditor's Copy | Generated for Admin Authorized Access | Page ${i + 1} of ${range.count}`,
              50,
              795,
              { align: "center", width: 495 }
            );
        }

        doc.end();
      } catch (err) {
        logger.error(`Critical PDF Engine Failure: ${err.message}`);
        reject(err);
      }
    });
  }
}

module.exports = new ReportGenerator();
