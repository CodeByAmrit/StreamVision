const PDFDocument = require("pdfkit-table");
const fs = require("fs");
const path = require("path");
const logger = require("./logger");

/**
 * ReportGenerator (Production Stable Edition)
 * Generates an enterprise-grade performance and infrastructure PDF audit report.
 */
class ReportGenerator {
  constructor() {
    this.logoPath = path.join(process.cwd(), "public", "images", "netwon.svg");
  }

  _safeNum(val, fallback = 0) {
    const num = Number(val);
    return isNaN(num) ? fallback : num;
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
      .text(String(value), safeX + 18, safeY + 32, { width: cardWidth - 36 });

    doc
      .fillColor("#000000")
      .fontSize(9)
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

        // HEADER
        doc.save();
        doc.translate(50, 40).scale(0.04).fillColor("#1e40af").path("M351.344 0C392.969 14.8157 524.053 56.2997 698.455 103.71C713.271 421.19 658.241 541.832 571.463 639.192C502.191 716.912 394.142 765.971 349.516 780.902V781C349.468 780.984 349.42 780.967 349.371 780.951C349.323 780.967 349.276 780.984 349.228 781V780.902C304.611 765.971 198.669 716.913 129.397 639.192C42.6191 541.832 -12.4111 421.189 2.4046 103.71C176.806 56.2998 309.719 14.8158 351.344 0Z").fill();
        doc.restore();

        doc.fillColor("#1e40af").fontSize(22).font("Helvetica-Bold").text("StreamVision Analytics", 110, 45);
        doc.fillColor("#4b5563").fontSize(10).font("Helvetica").text("Cloud Infrastructure & Streaming Performance Audit", 110, 68);

        doc.fontSize(8.5).fillColor("#9ca3af")
           .text(`Report ID: SV-${Date.now().toString().slice(-6)}`, 400, 45, { align: "right" })
           .text(`Period: ${String(timeframe)}`, 400, 56, { align: "right" })
           .text(`System Time: ${new Date().toLocaleString()}`, 400, 67, { align: "right" });

        doc.moveTo(50, 95).lineTo(545, 95).lineWidth(0.5).stroke("#e5e7eb");

        // KPI GRID
        const avgCpu = this._safeNum(data.avgCpu, 0);
        const avgRam = this._safeNum(data.avgRam, 0);
        const errorRate = this._safeNum(data.errorRate, 0);
        const totalReq = Math.round(this._safeNum(data.totalRequests, 0));

        const cardX1 = 50, cardX2 = 303, row1Y = 110, row2Y = 110 + 92;

        this.drawCard(doc, cardX1, row1Y, "Server CPU Load", `${avgCpu}%`, avgCpu < 80 ? "Nominal performance" : "Critical load surge", "#3b82f6");
        this.drawCard(doc, cardX2, row1Y, "Memory Utilization", `${avgRam}%`, avgRam < 90 ? "Healthy headroom" : "Capacity alert triggered", "#8b5cf6");
        this.drawCard(doc, cardX1, row2Y, "Cumulative Traffic", totalReq.toLocaleString(), "Total requests processed", "#10b981");
        this.drawCard(doc, cardX2, row2Y, "Global Error Rate", `${errorRate}%`, Number(errorRate) < 1 ? "Within SLA targets" : "Requires urgent audit", "#ef4444");

        doc.y = this._safeNum(row2Y + 105, 307);

        // TABLE
        await doc.table({
          title: "Infrastructure Stability Matrix",
          subtitle: "Granular status and telemetry for mission-critical core services",
          headers: [
            { label: "Service Identifier", width: 140, align: "left" },
            { label: "Status", width: 80, align: "center" },
            { label: "Performance Statistics", width: 275, align: "left" },
          ],
          rows: (data.services || []).map((s) => [
            String(s.name || "Unknown"),
            String(s.status || "UNKNOWN").toUpperCase(),
            String(s.details || "No telemetry available"),
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
        doc.fontSize(13).font("Helvetica-Bold").fillColor("#111827").text("Telemetry & Cluster Analysis");
        doc.moveDown(0.5);
        doc.fontSize(10).font("Helvetica").fillColor("#4b5563").lineGap(3).text(`Automated log forensics via Loki detected ${data.criticalErrors || 0} critical event signatures for the timeframe (${timeframe}).`);

        if (data.alerts && data.alerts.length > 0) {
          doc.moveDown(0.8).fillColor("#d97706").font("Helvetica-Bold").text("Detected Operational Anomalies:", { underline: true });
          data.alerts.forEach((alert) => doc.moveDown(0.3).font("Helvetica").fillColor("#000000").text(`\u2022 ${alert}`, { indent: 10 }));
        } else {
          doc.moveDown(0.8).fillColor("#059669").font("Helvetica-Bold").text("\u2714 No anomalies detected. System operating within nominal professional parameters.");
        }

        doc.moveDown(2.5).fontSize(13).font("Helvetica-Bold").fillColor("#111827").text("Administrative Validation");
        doc.fontSize(9).font("Helvetica").fillColor("#6b7280").text("This report is an internal system audit generated automatically. Any identified deviations from the SLA should be cross-referenced with the Grafana enterprise dashboards.", { lineGap: 2 });

        this.drawSignatures(doc, doc.y);

        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
          doc.switchToPage(i);
          doc.fontSize(8).fillColor("#d1d5db").text(`StreamVision Enterprise Analytics | Page ${i + 1} of ${range.count}`, 50, 795, { align: "center", width: 495 });
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
