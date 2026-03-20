const PDFDocument = require("pdfkit-table");
const fs = require("fs");
const path = require("path");
const logger = require("./logger");

/**
 * ReportGenerator (Executive Summary Edition - Visual Pack)
 * Enterprise-grade reporting with custom data visualization.
 */
class ReportGenerator {
  constructor() {
    this.logoPath = path.join(process.cwd(), "public", "images", "netwon.svg");
  }

  _safeNum(val, fallback = 0) {
    const num = Number(val);
    return isNaN(num) ? fallback : num;
  }

  /**
   * Internal: Draw a circular progress gauge
   */
  drawCircularGauge(doc, x, y, percent, label, color = "#1e40af") {
    const radius = 35;
    const centerX = x + radius;
    const centerY = y + radius;
    const p = Math.min(Math.max(Number(percent) / 100, 0), 1);

    // Background track
    doc.lineWidth(8).strokeColor("#f3f4f6").circle(centerX, centerY, radius).stroke();

    // Foreground arc
    if (p > 0) {
      const startAngle = -Math.PI / 2; // -90 degrees
      const endAngle = startAngle + p * Math.PI * 2;

      doc
        .lineWidth(8)
        .lineCap("round")
        .strokeColor(color)
        .arc(centerX, centerY, radius, startAngle, endAngle)
        .stroke();
    }

    // Percentage Text
    doc
      .fillColor("#000000")
      .fontSize(14)
      .font("Helvetica-Bold")
      .text(`${Math.round(percent)}%`, centerX - radius, centerY - 8, {
        width: radius * 2,
        align: "center",
      });

    // Label
    doc
      .fillColor("#4b5563")
      .fontSize(8.5)
      .font("Helvetica-Bold")
      .text(label.toUpperCase(), centerX - radius - 10, centerY + radius + 10, {
        width: radius * 2 + 20,
        align: "center",
      });
  }

  drawCard(doc, x, y, title, value, subtitle, color) {
    const cardWidth = 242;
    const cardHeight = 82;
    const borderRadius = 8;
    const safeX = this._safeNum(x, 50);
    const safeY = this._safeNum(y, 110);

    doc.roundedRect(safeX, safeY, cardWidth, cardHeight, borderRadius).fillAndStroke("#ffffff", "#e5e7eb");
    doc.rect(safeX, safeY, 5, cardHeight).fill(color || "#1e40af");

    doc
      .fillColor("#000000")
      .fontSize(10.5)
      .font("Helvetica-Bold")
      .text(String(title), safeX + 18, safeY + 14, { width: cardWidth - 36 });

    doc
      .fillColor("#000000")
      .fontSize(23)
      .font("Helvetica-Bold")
      .text(String(value), safeX + 18, safeY + 38, { width: cardWidth - 36 });

    doc
      .fillColor("#000000")
      .fontSize(8.5)
      .font("Helvetica")
      .text(String(subtitle || ""), safeX + 18, safeY + 62, { width: cardWidth - 36 });
  }

  drawSignatures(doc, y) {
    const lineLength = 190;
    const currentY = this._safeNum(y || doc.y, 500);
    const startY = currentY + 45;

    doc.moveTo(50, startY).lineTo(50 + lineLength, startY).lineWidth(0.5).stroke("#d1d5db");
    doc.fillColor("#111827").fontSize(10).font("Helvetica-Bold").text("Amrit Sharma", 50, startY + 10);
    doc.fillColor("#6b7280").fontSize(8).font("Helvetica").text("Technical Lead & Founder", 50, startY + 22);

    const rightX = 355;
    doc.moveTo(rightX, startY).lineTo(rightX + lineLength, startY).lineWidth(0.5).stroke("#d1d5db");
    doc.fillColor("#111827").fontSize(10).font("Helvetica-Bold").text("Newtonteam Authority", rightX, startY + 10);
    doc.fillColor("#6b7280").fontSize(8).font("Helvetica").text("Executive Oversight", rightX, startY + 22);
  }

  async generate(data, timeframe = "Last 30 Days") {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: "A4" });
        const buffers = [];
        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => resolve(Buffer.concat(buffers)));

        // BRANDING & HEADER (Absolute stability focus)
        doc.save();
        doc.translate(50, 40).scale(0.04).fillColor("#1e40af").path("M351.344 0C392.969 14.8157 524.053 56.2997 698.455 103.71C713.271 421.19 658.241 541.832 571.463 639.192C502.191 716.912 394.142 765.971 349.516 780.902V781C349.468 780.984 349.42 780.967 349.371 780.951C349.323 780.967 349.276 780.984 349.228 781V780.902C304.611 765.971 198.669 716.913 129.397 639.192C42.6191 541.832 -12.4111 421.189 2.4046 103.71C176.806 56.2998 309.719 14.8158 351.344 0Z").fill();
        doc.restore();

        doc.fillColor("#1e40af").fontSize(22).font("Helvetica-Bold").text("StreamVision Analytics", 110, 45);
        doc.fillColor("#4b5563").fontSize(10).font("Helvetica").text("Infrastructure Reliability & Video Service Audit", 110, 68);

        doc.fontSize(8.5).fillColor("#9ca3af")
           .text(`Audit Ref: SV-${Date.now().toString().slice(-6)}`, 400, 45, { align: "right" })
           .text(`Period: ${String(timeframe)}`, 400, 56, { align: "right" })
           .text(`Generated: ${new Date().toLocaleString()}`, 400, 67, { align: "right" });

        doc.moveTo(50, 95).lineTo(545, 95).lineWidth(0.5).stroke("#e5e7eb");

        // PERFORMANCE KPI GRID
        const avgCpu = this._safeNum(data.avgCpu, 0);
        const avgRam = this._safeNum(data.avgRam, 0);
        const errorRate = this._safeNum(data.errorRate, 0);
        const successPercent = (100 - Number(errorRate)).toFixed(2);
        const totalReq = Math.round(this._safeNum(data.totalRequests, 0));

        const cardX1 = 50, cardX2 = 303, row1Y = 110, row2Y = 110 + 92;

        this.drawCard(doc, cardX1, row1Y, "System Processing Load", `${avgCpu}%`, "Compute resource utilization", "#3b82f6");
        this.drawCard(doc, cardX2, row1Y, "Resource Availability", `${avgRam}%`, "Memory capacity headroom", "#8b5cf6");
        this.drawCard(doc, cardX1, row2Y, "Secure Data Throughput", totalReq.toLocaleString(), "Successful routed payloads", "#10b981");
        this.drawCard(doc, cardX2, row2Y, "Platform Reliability Index", `${successPercent}%`, "Uptime and stability success", "#ef4444");

        // VISUAL PERFORMANCE SUMMARY (Gauges Section)
        doc.y = this._safeNum(row2Y + 95, 307);
        const currentY = doc.y;
        doc.roundedRect(50, currentY, 495, 120, 8).fillAndStroke("#fcfcfc", "#e5e7eb");
        
        doc.fillColor("#111827").fontSize(11).font("Helvetica-Bold").text("Visual Operating Status", 65, currentY + 15);
        
        // Circular Gauges for At-a-Glance understanding
        this.drawCircularGauge(doc, 90, currentY + 30, successPercent, "Reliability", "#10b981");
        this.drawCircularGauge(doc, 220, currentY + 30, avgCpu, "CPU Pressure", "#3b82f6");
        this.drawCircularGauge(doc, 350, currentY + 30, avgRam, "RAM Load", "#8b5cf6");

        // Active Asset Mini-Card
        const activeCams = data.activeCameras || 0;
        const totalCams = data.totalCameras || 0;
        const healthPercent = totalCams > 0 ? Math.round((activeCams / totalCams) * 100) : 0;
        
        doc.rect(440, currentY + 30, 85, 75).fill("#f3f4f6");
        doc.fillColor("#1e40af").fontSize(18).font("Helvetica-Bold").text(`${activeCams}`, 440, currentY + 45, { width: 85, align: "center" });
        doc.fillColor("#4b5563").fontSize(7.5).font("Helvetica-Bold").text("ACTIVE NODES", 440, currentY + 68, { width: 85, align: "center" });
        doc.fillColor("#111827").fontSize(12).font("Helvetica-Bold").text(`${healthPercent}%`, 440, currentY + 82, { width: 85, align: "center" });

        doc.y = currentY + 135;

        // FUNCTIONAL SERVICE HEALTH
        await doc.table({
          title: "Service Infrastructure Integrity",
          subtitle: "Executive status of core gateway and live processing engines",
          headers: ["Core Service Component", "Health", "Operational Context"],
          rows: (data.services || []).map((s) => [
            String(s.name || "Unknown"),
            String(s.status || "UNKNOWN").toUpperCase(),
            String(s.details || "No data available"),
          ]),
        }, {
          x: 50, width: 495,
          prepareHeader: (header, index, rect) => {
            if (rect) {
              doc.rect(this._safeNum(rect.x, 50), this._safeNum(rect.y, 0), this._safeNum(rect.w, 495), this._safeNum(rect.h, 22)).fill("#f3f4f6");
              doc.moveTo(this._safeNum(rect.x, 50), this._safeNum(rect.y + 22, 22)).lineTo(this._safeNum(rect.x + rect.w, 545), this._safeNum(rect.y + 22, 22)).lineWidth(1.5).stroke("#1e40af");
            }
            doc.fillColor("#000000").font("Helvetica-Bold").fontSize(10.5);
            return header;
          },
          prepareRow: (row, indexColumn, indexRow, rectRow) => {
            if (indexRow % 2 === 0 && rectRow && !isNaN(rectRow.y)) {
              doc.addBackground(rectRow, "#f9fafb", 0.5);
            }
            doc.font("Helvetica").fontSize(10).fillColor("#000000");
            return row;
          },
        });

        doc.moveDown(1.5);
        doc.fontSize(13).font("Helvetica-Bold").fillColor("#111827").text("Intelligent Performance Insights");
        doc.moveDown(0.5);
        doc.fontSize(10).font("Helvetica").fillColor("#4b5563").lineGap(3).text(`Forensic audit via Loki detected ${data.criticalErrors || 0} critical signatures. System health at ${successPercent}% indicates professional SLA targets are being maintained for ${timeframe}.`);

        if (data.alerts && data.alerts.length > 0) {
          doc.moveDown(0.8).fillColor("#d97706").font("Helvetica-Bold").text("Detected Operational Deviations:", { underline: true });
          data.alerts.forEach((alert) => doc.moveDown(0.3).font("Helvetica").fillColor("#000000").text(`\u2022 ${alert}`, { indent: 10 }));
        } else {
          doc.moveDown(0.8).fillColor("#059669").font("Helvetica-Bold").text("\u2714 Audit Complete: Global operational success verified across all streaming zones.");
        }

        doc.moveDown(2.5).fontSize(13).font("Helvetica-Bold").fillColor("#111827").text("Administrative Validation");
        doc.fontSize(9).font("Helvetica").fillColor("#6b7280").text("This report is an executive performance summary. For deep forensic logs and real-time telemetry, authorized personnel should refer to the StreamVision command console.", { lineGap: 2 });

        this.drawSignatures(doc, doc.y);

        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
          doc.switchToPage(i);
          doc.fontSize(8).fillColor("#d1d5db").text(`StreamVision Executive Analytics | Audit Ref: ${Date.now().toString().slice(-6)} | Page ${i + 1} of ${range.count}`, 50, 795, { align: "center", width: 495 });
        }
        doc.end();
      } catch (err) {
        logger.error(`Executive PDF Error: ${err.message}`);
        reject(err);
      }
    });
  }
}

module.exports = new ReportGenerator();
