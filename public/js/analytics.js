// Analytics Dashboard JavaScript

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Hide loading screen
  setTimeout(() => {
    const introScreen = document.getElementById("introScreen");
    if (introScreen) {
      introScreen.style.opacity = "0";
      setTimeout(() => {
        introScreen.style.display = "none";
      }, 300);
    }
  }, 800);

  // Initialize analytics dashboard
  initializeAnalytics();
});

// Analytics dashboard initialization
function initializeAnalytics() {
  console.log("StreamVision Analytics Dashboard initialized");

  // Initialize charts
  initializeCharts();

  // Initialize refresh button
  initializeRefreshButton();

  // Initialize time range selector
  initializeTimeRangeSelector();

  // Initialize generate report button
  initializeReportGenerator();

  // Initialize additional features
  initializeCardHoverEffects();
  initializeChartExports();
  initializeDvrDrillDown();

  // Start live updates
  startLiveUpdates();
}

// Initialize charts with real data
function initializeCharts() {
  if (!window.analyticsData) {
    console.error(
      "Analytics data not found. Please ensure analyticsData is initialized."
    );
    return;
  }

  const { dvrNames, activeStreamsData, totalCameras, activeCameras } =
    window.analyticsData;

  // DVR Streams Chart
  const dvrStreamsCtx = document.getElementById("dvrStreamsChart");
  if (!dvrStreamsCtx) return;

  const dvrStreamsChart = new Chart(dvrStreamsCtx.getContext("2d"), {
    type: "bar",
    data: {
      labels: dvrNames,
      datasets: [
        {
          label: "Active Streams",
          data: activeStreamsData,
          backgroundColor: "rgba(99, 179, 237, 0.5)",
          borderColor: "rgba(99, 179, 237, 1)",
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleColor: "#fff",
          bodyColor: "#fff",
          borderColor: "rgba(99, 179, 237, 0.5)",
          borderWidth: 1,
          callbacks: {
            label: function (context) {
              const dvrIndex = context.dataIndex;
              const dvr = window.analyticsData.dvrs[dvrIndex];
              const activeCount = activeStreamsData[dvrIndex];
              const totalCount = dvr ? dvr.total_cameras || 0 : 0;

              return [
                `Active: ${activeCount}`,
                `Total: ${totalCount}`,
                `Location: ${dvr ? dvr.location_name || "Unknown" : "Unknown"}`,
              ];
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(0, 0, 0, 0.1)",
          },
          ticks: {
            color: "#6b7280",
          },
          title: {
            display: true,
            text: "Number of Streams",
            color: "#6b7280",
          },
        },
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: "#6b7280",
            maxRotation: 45,
          },
        },
      },
    },
  });

  // Data for Camera Status Chart
  const inactiveCameras = Math.max(0, totalCameras - activeCameras);

  // Camera Status Chart
  const cameraStatusCtx = document.getElementById("cameraStatusChart");
  if (!cameraStatusCtx) return;

  const cameraStatusChart = new Chart(cameraStatusCtx.getContext("2d"), {
    type: "doughnut",
    data: {
      labels: ["Active Cameras", "Inactive Cameras"],
      datasets: [
        {
          data: [activeCameras, inactiveCameras],
          backgroundColor: ["rgba(34, 197, 94, 0.7)", "rgba(239, 68, 68, 0.7)"],
          borderColor: ["rgba(34, 197, 94, 1)", "rgba(239, 68, 68, 1)"],
          borderWidth: 2,
          hoverOffset: 15,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "70%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#6b7280",
            padding: 20,
            usePointStyle: true,
            pointStyle: "circle",
          },
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleColor: "#fff",
          bodyColor: "#fff",
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.raw || 0;
              const percentage = Math.round((value / totalCameras) * 100);
              return `${label}: ${value} (${percentage}%)`;
            },
          },
        },
      },
    },
  });

  // Store charts for updates
  window.analyticsCharts = {
    dvrStreams: dvrStreamsChart,
    cameraStatus: cameraStatusChart,
  };
}

// Refresh button functionality
function initializeRefreshButton() {
  const refreshBtn = document.getElementById("refresh-analytics");
  const lastUpdated = document.getElementById("last-updated");

  if (refreshBtn) {
    refreshBtn.addEventListener("click", async function () {
      // Add rotation animation
      this.classList.add("animate-spin");

      try {
        // Fetch updated data
        const response = await fetch("/api/analytics/data");
        const data = await response.json();

        // Update charts with new data
        updateCharts(data);

        // Update last updated time
        if (lastUpdated) {
          lastUpdated.textContent = "Just now";
        }

        // Show success notification
        showNotification("Analytics data refreshed successfully", "success");
      } catch (error) {
        console.error("Error refreshing analytics:", error);
        showNotification("Failed to refresh analytics data", "error");
      } finally {
        // Remove animation
        setTimeout(() => {
          this.classList.remove("animate-spin");
        }, 1000);
      }
    });
  }
}

// Time range selector functionality
function initializeTimeRangeSelector() {
  const timeRangeSelect = document.getElementById("time-range");

  if (timeRangeSelect) {
    timeRangeSelect.addEventListener("change", function () {
      const range = this.value;

      // Show loading state
      showNotification(`Loading ${range} data...`, "info");

      // In a real application, fetch data for the selected time range
      // For now, simulate with a timeout
      setTimeout(() => {
        showNotification(
          `${range.charAt(0).toUpperCase() + range.slice(1)} data loaded`,
          "success"
        );
      }, 500);
    });
  }
}

// Generate report functionality
function initializeReportGenerator() {
  const generateReportBtn = document.getElementById("generate-report");

  if (generateReportBtn) {
    generateReportBtn.addEventListener("click", async function () {
      // Show loading state
      const originalText = this.innerHTML;
      this.innerHTML =
        '<i class="fas fa-spinner fa-spin mr-2"></i> Generating...';
      this.disabled = true;

      try {
        // Simulate report generation
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Create a simple report using the window.analyticsData
        const reportData = {
          timestamp: new Date().toISOString(),
          totalDvrs: window.analyticsData?.totalDvrs || 0,
          totalCameras: window.analyticsData?.totalCameras || 0,
          activeStreams: window.analyticsData?.activeCameras || 0,
          activeDvrs: window.analyticsData?.activeDvrsCount || 0,
          utilizationRate:
            Math.round(
              (window.analyticsData?.activeCameras /
                window.analyticsData?.totalCameras) *
                100
            ) || 0,
        };

        // Create and download report
        const reportBlob = new Blob([JSON.stringify(reportData, null, 2)], {
          type: "application/json",
        });

        const downloadUrl = URL.createObjectURL(reportBlob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `streamvision-analytics-${
          new Date().toISOString().split("T")[0]
        }.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);

        showNotification("Analytics report generated successfully", "success");
      } catch (error) {
        console.error("Error generating report:", error);
        showNotification("Failed to generate report", "error");
      } finally {
        // Reset button state
        this.innerHTML = originalText;
        this.disabled = false;
      }
    });
  }
}

// Live updates for real-time analytics
function startLiveUpdates() {
  // Update "last updated" time every minute
  setInterval(() => {
    const lastUpdated = document.getElementById("last-updated");
    if (lastUpdated) {
      const now = new Date();
      lastUpdated.textContent = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    }
  }, 60000);

  // Simulate periodic data updates (every 30 seconds)
  window.analyticsUpdateInterval = setInterval(() => {
    updateLiveData();
  }, 30000);
}

// Update charts with new data
function updateCharts(data) {
  if (!window.analyticsCharts) return;

  const { dvrStreams, cameraStatus } = window.analyticsCharts;

  // Update DVR streams chart
  if (dvrStreams && data.dvrStreamsData) {
    dvrStreams.data.datasets[0].data = data.dvrStreamsData;
    dvrStreams.update("none");
  }

  // Update camera status chart
  if (cameraStatus && data.cameraStatusData) {
    cameraStatus.data.datasets[0].data = data.cameraStatusData;
    cameraStatus.update("none");
  }

  // Update stats display if provided
  if (data.stats) {
    updateStatsDisplay(data.stats);
  }
}

// Update live data by fetching from the API
async function updateLiveData() {
  try {
    const response = await fetch("/api/analytics/data");
    if (!response.ok) {
      throw new Error("Failed to fetch analytics data");
    }
    const updatedData = await response.json();

    // Update charts with new data
    updateCharts(updatedData);

    // Update last updated time
    const lastUpdated = document.getElementById("last-updated");
    if (lastUpdated) {
      lastUpdated.textContent = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  } catch (error) {
    console.error("Error updating live data:", error);
  }
}

// Update stats display
function updateStatsDisplay(stats) {
  if (!stats) return;

  // Helper function to find elements
  const findElementByText = (partialText) => {
    const elements = document.querySelectorAll("*");
    for (let element of elements) {
      if (element.textContent && element.textContent.includes(partialText)) {
        return element;
      }
    }
    return null;
  };

  // Update bandwidth display
  const bandwidthContainer = document.querySelector(
    'div:has(> span:contains("Bandwidth Usage"))'
  );
  if (bandwidthContainer && stats.bandwidth) {
    const bandwidthValue = bandwidthContainer.querySelector("span:last-child");
    if (bandwidthValue) {
      bandwidthValue.textContent = stats.bandwidth;
    }

    // Update progress bar
    const bandwidthNum = parseFloat(stats.bandwidth);
    const percentage = Math.min(95, (bandwidthNum / 3.0) * 100);
    const progressBar =
      bandwidthContainer.nextElementSibling?.querySelector(".bg-gradient-to-r");
    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
    }
  }

  // Update latency display
  const latencyContainer = document.querySelector(
    'div:has(> span:contains("Latency"))'
  );
  if (latencyContainer && stats.latency) {
    const latencyValue = latencyContainer.querySelector("span:last-child");
    if (latencyValue) {
      latencyValue.textContent = stats.latency;
    }

    // Update progress bar and color based on latency
    const latencyNum = parseInt(stats.latency);
    const progressBar =
      latencyContainer.nextElementSibling?.querySelector(".bg-gradient-to-r");
    if (progressBar) {
      let percentage;
      if (latencyNum < 100) {
        percentage = 30;
        progressBar.className =
          "bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full";
      } else if (latencyNum < 200) {
        percentage = 50;
        progressBar.className =
          "bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full";
      } else if (latencyNum < 300) {
        percentage = 70;
        progressBar.className =
          "bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full";
      } else {
        percentage = 90;
        progressBar.className =
          "bg-gradient-to-r from-red-400 to-red-500 h-2 rounded-full";
      }
      progressBar.style.width = `${percentage}%`;
    }
  }

  // Update quality display
  const qualityContainer = document.querySelector(
    'div:has(> span:contains("Stream Quality"))'
  );
  if (qualityContainer && stats.quality) {
    const qualityValue = qualityContainer.querySelector("span:last-child");
    if (qualityValue) {
      qualityValue.textContent = stats.quality;
    }

    // Update progress bar
    const qualityNum = parseInt(stats.quality);
    const progressBar =
      qualityContainer.nextElementSibling?.querySelector(".bg-gradient-to-r");
    if (progressBar) {
      progressBar.style.width = `${qualityNum}%`;
    }
  }
}

// Show notification
function showNotification(message, type = "info") {
  // Remove any existing notifications
  const existingNotification = document.querySelector(
    ".analytics-notification"
  );
  if (existingNotification) {
    existingNotification.remove();
  }

  // Create notification element
  const notification = document.createElement("div");
  notification.className = `analytics-notification fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border transform transition-transform duration-300 translate-x-full ${
    type === "success"
      ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
      : type === "error"
      ? "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
      : "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200"
  }`;

  notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${
              type === "success"
                ? "fa-check-circle"
                : type === "error"
                ? "fa-exclamation-circle"
                : "fa-info-circle"
            } mr-2"></i>
            <span>${message}</span>
        </div>
    `;

  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.classList.remove("translate-x-full");
    notification.classList.add("translate-x-0");
  }, 10);

  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.classList.remove("translate-x-0");
    notification.classList.add("translate-x-full");
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Handle card hover effects
function initializeCardHoverEffects() {
  const cards = document.querySelectorAll(".card-hover");

  cards.forEach((card) => {
    card.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-4px)";
      this.style.transition = "transform 0.2s ease, box-shadow 0.2s ease";
      this.style.boxShadow =
        "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
    });

    card.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0)";
      this.style.boxShadow = "";
    });
  });
}

// Export charts functionality
function initializeChartExports() {
  const exportButtons = document.querySelectorAll("button:has(.fa-download)");

  exportButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const chartType =
        this.closest("div").previousElementSibling?.querySelector("h3")
          ?.textContent || "chart";
      const chartId = this.closest(".rounded-2xl").querySelector("canvas")?.id;

      if (chartId && window.analyticsCharts) {
        const chart = Object.values(window.analyticsCharts).find(
          (ch) => ch.canvas.id === chartId
        );

        if (chart) {
          const url = chart.toBase64Image();
          const a = document.createElement("a");
          a.href = url;
          a.download = `${chartType.toLowerCase().replace(/\s+/g, "-")}-${
            new Date().toISOString().split("T")[0]
          }.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          showNotification(`Exported ${chartType} as PNG`, "success");
        }
      }
    });
  });
}

// Add click event to DVR items for drill-down
function initializeDvrDrillDown() {
  const dvrItems = document.querySelectorAll(".hover\\:bg-blue-50\\/30");

  dvrItems.forEach((item) => {
    item.addEventListener("click", function () {
      const dvrName = this.querySelector("h4")?.textContent;
      if (dvrName) {
        showNotification(`Loading detailed view for ${dvrName}...`, "info");

        // In a real application, you would navigate to a detailed DVR view
        // For now, simulate with a timeout
        setTimeout(() => {
          showNotification(
            `Detailed view for ${dvrName} would open here`,
            "info"
          );
        }, 500);
      }
    });

    // Make it clear it's clickable
    item.style.cursor = "pointer";
  });
}

// Handle page visibility changes for performance
document.addEventListener("visibilitychange", function () {
  if (document.hidden) {
    // Page is hidden, pause updates
    if (window.analyticsUpdateInterval) {
      clearInterval(window.analyticsUpdateInterval);
    }
  } else {
    // Page is visible, resume updates
    if (!window.analyticsUpdateInterval) {
      startLiveUpdates();
    }
  }
});

// Clean up on page unload
window.addEventListener("beforeunload", function () {
  if (window.analyticsCharts) {
    Object.values(window.analyticsCharts).forEach((chart) => {
      chart.destroy();
    });
  }

  if (window.analyticsUpdateInterval) {
    clearInterval(window.analyticsUpdateInterval);
  }
});

// Make functions available globally for debugging
window.StreamVisionAnalytics = {
  refresh: () => {
    const refreshBtn = document.getElementById("refresh-analytics");
    if (refreshBtn) refreshBtn.click();
  },
  exportReport: () => {
    const reportBtn = document.getElementById("generate-report");
    if (reportBtn) reportBtn.click();
  },
  simulateUpdate: () => updateLiveData(),
  showNotification: showNotification,
  getData: () => window.analyticsData,
};
