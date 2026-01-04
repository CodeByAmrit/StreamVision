// DVR Management JavaScript

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

  // Initialize DVR management functionality
  initializeDVRManagement();
});

// DVR management initialization
function initializeDVRManagement() {
  console.log("StreamVision DVR Management initialized");

  // Initialize delete functionality
  initializeDeleteButtons();

  // Initialize show more/less functionality
  initializeShowDetails();

  // Initialize status filter
  initializeStatusFilter();

  // Initialize refresh button
  initializeRefreshButton();

  // Initialize search form
  initializeSearchForm();

  // Initialize tooltips
  initializeTooltips();

  // Add animation to table rows
  animateTableRows();
}

// Delete DVR functionality
function initializeDeleteButtons() {
  const deleteButtons = document.querySelectorAll(".delete-dvr-btn");
  const deleteModal = document.getElementById("delete-modal");
  const cancelDeleteBtn = document.getElementById("cancel-delete");
  const confirmDeleteBtn = document.getElementById("confirm-delete");
  const dvrNameSpan = document.getElementById("dvr-name");

  let currentDvrId = null;
  let currentDvrName = null;

  deleteButtons.forEach((button) => {
    button.addEventListener("click", function () {
      currentDvrId = this.getAttribute("data-dvr-id");
      currentDvrName = this.getAttribute("data-dvr-name");

      // Update modal content
      dvrNameSpan.textContent = currentDvrName;

      // Show modal
      deleteModal.classList.remove("hidden");
    });
  });

  // Cancel delete
  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener("click", function () {
      deleteModal.classList.add("hidden");
      currentDvrId = null;
      currentDvrName = null;
    });
  }

  // Confirm delete
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", async function () {
      if (!currentDvrId) return;

      // Show loading state
      this.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Deleting...';
      this.disabled = true;

      try {
        // Send delete request
        const response = await fetch(`/dvr/delete/${currentDvrId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]')?.content || "",
          },
        });

        const result = await response.json();

        if (result.success) {
          // Show success message
          showFlashMessage(`DVR "${currentDvrName}" deleted successfully`, "success");

          // Remove the row from table
          const row = document
            .querySelector(`[data-dvr-id="${currentDvrId}"]`)
            ?.closest(".hover\\:bg-blue-50");
          if (row) {
            row.style.opacity = "0";
            row.style.transform = "translateX(-100px)";
            setTimeout(() => row.remove(), 300);
          }

          // Update total count
          updateDVRCounts();
        } else {
          showFlashMessage(`Failed to delete DVR: ${result.message}`, "error");
        }
      } catch (error) {
        console.error("Delete error:", error);
        showFlashMessage("Network error. Please try again.", "error");
      } finally {
        // Reset button and hide modal
        this.innerHTML = "Delete DVR";
        this.disabled = false;
        deleteModal.classList.add("hidden");
        currentDvrId = null;
        currentDvrName = null;
      }
    });
  }

  // Close modal when clicking outside
  deleteModal.addEventListener("click", function (e) {
    if (e.target === this) {
      this.classList.add("hidden");
      currentDvrId = null;
      currentDvrName = null;
    }
  });
}

// Show/Hide details functionality
function initializeShowDetails() {
  const showMoreButtons = document.querySelectorAll(".show-more-btn");

  showMoreButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const additionalInfo = this.previousElementSibling;
      const icon = this.querySelector("i");

      if (additionalInfo && additionalInfo.classList.contains("additional-info")) {
        if (additionalInfo.classList.contains("hidden")) {
          // Show details
          additionalInfo.classList.remove("hidden");
          icon.classList.remove("fa-chevron-down");
          icon.classList.add("fa-chevron-up");
          this.innerHTML = '<i class="fas fa-chevron-up mr-1"></i> Show Less';
        } else {
          // Hide details
          additionalInfo.classList.add("hidden");
          icon.classList.remove("fa-chevron-up");
          icon.classList.add("fa-chevron-down");
          this.innerHTML = '<i class="fas fa-chevron-down mr-1"></i> Show Details';
        }
      }
    });
  });
}

// Status filter functionality
function initializeStatusFilter() {
  const statusFilter = document.getElementById("status-filter");
  const searchInput = document.getElementById("search");

  if (statusFilter) {
    // Set current value from URL
    const urlParams = new URLSearchParams(window.location.search);
    const currentStatus = urlParams.get("status") || "all";
    statusFilter.value = currentStatus;

    statusFilter.addEventListener("change", function () {
      const status = this.value;
      let url = "/dvr";
      const params = new URLSearchParams();

      const search = searchInput ? searchInput.value : "";
      if (search) {
        params.append("search", search);
      }

      if (status !== "all") {
        params.append("status", status);
      }

      const queryString = params.toString();
      if (queryString) {
        url += "?" + queryString;
      }

      window.location.href = url;
    });
  }
}

function initializeRefreshButton() {
  const refreshBtn = document.getElementById("refresh-btn");

  if (!refreshBtn) return;

  refreshBtn.addEventListener("click", async function () {
    this.classList.add("animate-spin");

    try {
      const res = await fetch("/dvr/status");
      const data = await res.json();

      updateDvrUI(data);

      showFlashMessage("DVR list refreshed", "success");
    } catch (err) {
      console.error("Refresh failed", err);
      showFlashMessage("Failed to refresh DVR list", "error");
    } finally {
      this.classList.remove("animate-spin");
    }
  });
}


// Search form functionality
function initializeSearchForm() {
  const searchForm = document.querySelector('form[method="GET"]');
  const searchInput = document.getElementById("search");

  if (searchForm && searchInput) {
    // Debounced search
    let searchTimeout;
    searchInput.addEventListener("input", function () {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        if (this.value.length >= 2 || this.value.length === 0) {
          searchForm.submit();
        }
      }, 500);
    });
  }
}

// Tooltip initialization
function initializeTooltips() {
  const tooltipElements = document.querySelectorAll("[data-tooltip]");

  tooltipElements.forEach((element) => {
    element.addEventListener("mouseenter", function (e) {
      const tooltipText = this.getAttribute("data-tooltip");

      if (tooltipText) {
        const tooltip = document.createElement("div");
        tooltip.className =
          "fixed z-50 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm dark:bg-gray-700";
        tooltip.textContent = tooltipText;
        tooltip.style.top = e.clientY - 40 + "px";
        tooltip.style.left = e.clientX + "px";
        tooltip.id = "dvr-tooltip";

        document.body.appendChild(tooltip);
      }
    });

    element.addEventListener("mouseleave", function () {
      const tooltip = document.getElementById("dvr-tooltip");
      if (tooltip) {
        tooltip.remove();
      }
    });
  });
}

// Animate table rows on load
function animateTableRows() {
  const rows = document.querySelectorAll(".hover\\:bg-blue-50");

  rows.forEach((row, index) => {
    row.style.opacity = "0";
    row.style.transform = "translateY(20px)";
    row.style.transition = "opacity 0.5s ease, transform 0.5s ease";
    row.style.transitionDelay = index * 0.05 + "s";

    setTimeout(() => {
      row.style.opacity = "1";
      row.style.transform = "translateY(0)";
    }, 100);
  });
}

// Update DVR counts after deletion
function updateDVRCounts() {
  const totalCountElement = document.querySelector('[data-stat="total-dvrs"]');
  const onlineCountElement = document.querySelector('[data-stat="online-dvrs"]');

  if (totalCountElement) {
    const currentCount = parseInt(totalCountElement.textContent) || 0;
    totalCountElement.textContent = Math.max(0, currentCount - 1);
  }

  if (onlineCountElement) {
    const currentCount = parseInt(onlineCountElement.textContent) || 0;
    onlineCountElement.textContent = Math.max(0, currentCount - 1);
  }
}

// Show flash message
function showFlashMessage(message, type = "success") {
  // Create message element
  const flashDiv = document.createElement("div");
  flashDiv.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-lg transform transition-all duration-300 translate-x-full ${
    type === "success"
      ? "bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-400"
      : "bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-400"
  }`;
  flashDiv.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${
              type === "success" ? "fa-check-circle" : "fa-exclamation-circle"
            } mr-3"></i>
            <span>${message}</span>
            <button class="ml-4 text-current hover:opacity-75" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

  document.body.appendChild(flashDiv);

  // Animate in
  setTimeout(() => {
    flashDiv.style.transform = "translateX(0)";
  }, 10);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (flashDiv.parentNode) {
      flashDiv.style.transform = "translateX(100%)";
      setTimeout(() => flashDiv.remove(), 300);
    }
  }, 5000);
}

// Export functions for global use
window.initializeDVRManagement = initializeDVRManagement;
window.showFlashMessage = showFlashMessage;

// Handle search query parameter
function handleSearchQuery() {
  const urlParams = new URLSearchParams(window.location.search);
  const search = urlParams.get("search");
  const status = urlParams.get("status");

  if (search) {
    const searchInput = document.getElementById("search");
    if (searchInput) {
      searchInput.value = search;
    }
  }

  if (status) {
    const statusFilter = document.getElementById("status-filter");
    if (statusFilter) {
      statusFilter.value = status;
    }
  }
}

function updateDvrUI(cameraStreams) {
  // Group by DVR
  const dvrMap = {};

  cameraStreams.forEach((c) => {
    if (!dvrMap[c.dvrId]) {
      dvrMap[c.dvrId] = {
        online: false,
        activeCameras: 0,
        cameras: [],
      };
    }

    if (c.online) {
      dvrMap[c.dvrId].online = true;
      dvrMap[c.dvrId].activeCameras += 1;
      dvrMap[c.dvrId].cameras.push(c);
    }
  });

  // Update DVR rows
  Object.entries(dvrMap).forEach(([dvrId, stats]) => {
    const dvrRow = document.querySelector(`[data-dvr-id="${dvrId}"]`);
    if (!dvrRow) return;

    // ===== Status badge =====
    const badge = dvrRow.querySelector(".status-badge");
    if (badge) {
      if (stats.online) {
        badge.className =
          "status-badge inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400";
        badge.innerHTML = `<i class="fas fa-circle-check mr-2"></i> Online <span class="ml-1 text-xs">(${stats.activeCameras} active)</span>`;
      } else {
        badge.className =
          "status-badge inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400";
        badge.innerHTML = `<i class="fas fa-circle-exclamation mr-2"></i> Offline`;
      }
    }

    // ===== Live Streams text =====
    const liveBox = dvrRow.querySelector(".live-stream-info");
    if (liveBox) {
      if (stats.cameras.length) {
        liveBox.innerHTML = stats.cameras
          .map(
            (c) => `<div class="text-xs">${c.resolution} · ${c.fps} FPS · ${c.bitrate} kbps</div>`
          )
          .join("");
      } else {
        liveBox.innerHTML = `<span class="text-xs text-gray-400">No active streams</span>`;
      }
    }
  });
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", handleSearchQuery);
