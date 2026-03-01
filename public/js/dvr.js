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
        const response = await fetch(`/dvr/${currentDvrId}`, {
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
          const row = document.querySelector(`div[data-dvr-id="${currentDvrId}"]`);
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
  const rows = document.querySelectorAll("div[data-dvr-id]");

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
// ===============================
// FLASH MESSAGE SYSTEM (FIXED)
// ===============================
function showFlashMessage(message, type = "success") {
  // Normalize type
  const messageType = type === "success" ? "success" : "error";

  const flashDiv = document.createElement("div");

  // Base classes
  flashDiv.className =
    "fixed top-4 right-4 max-w-sm w-full z-50 px-6 py-4 rounded-xl shadow-lg " +
    "transition-transform duration-300 ease-in-out translate-x-full";

  // Apply color classes safely
  if (messageType === "success") {
    flashDiv.classList.add(
      "bg-green-100",
      "dark:bg-green-900/30",
      "border",
      "border-green-200",
      "dark:border-green-800",
      "text-green-800",
      "dark:text-green-400"
    );
  } else {
    flashDiv.classList.add(
      "bg-red-100",
      "dark:bg-red-900/30",
      "border",
      "border-red-200",
      "dark:border-red-800",
      "text-red-800",
      "dark:text-red-400"
    );
  }

  // Create content safely (NO innerHTML injection)
  const container = document.createElement("div");
  container.className = "flex items-center";

  const icon = document.createElement("i");
  icon.className =
    "fas mr-3 " +
    (messageType === "success"
      ? "fa-check-circle"
      : "fa-exclamation-circle");

  const textSpan = document.createElement("span");
  textSpan.textContent = message;

  const closeBtn = document.createElement("button");
  closeBtn.className = "ml-4 text-current hover:opacity-75";

  const closeIcon = document.createElement("i");
  closeIcon.className = "fas fa-times";

  closeBtn.appendChild(closeIcon);

  container.appendChild(icon);
  container.appendChild(textSpan);
  container.appendChild(closeBtn);
  flashDiv.appendChild(container);

  document.body.appendChild(flashDiv);

  // Slide in
  requestAnimationFrame(() => {
    flashDiv.classList.remove("translate-x-full");
  });

  // Close button
  closeBtn.addEventListener("click", () => {
    removeFlash(flashDiv);
  });

  // Auto remove
  setTimeout(() => {
    removeFlash(flashDiv);
  }, 5000);
}

function removeFlash(el) {
  el.classList.add("translate-x-full");
  setTimeout(() => {
    if (el.parentNode) el.remove();
  }, 300);
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

  // Find all existing DVR rows and reset their status first
  const allRows = document.querySelectorAll("div[data-dvr-id]");
  allRows.forEach(row => {
    const dvrId = row.getAttribute("data-dvr-id");
    dvrMap[dvrId] = { online: false, activeCameras: 0, cameras: [] };
  });

  // Then populate with live data from ping/streams
  if (Array.isArray(cameraStreams)) {
    cameraStreams.forEach((c) => {
      if (!dvrMap[c.dvrId]) {
        dvrMap[c.dvrId] = { online: false, activeCameras: 0, cameras: [] };
      }
      if (c.online) {
        dvrMap[c.dvrId].online = true;
        dvrMap[c.dvrId].activeCameras += 1;
        dvrMap[c.dvrId].cameras.push(c);
      }
    });
  }

  // Update UI for each DVR row
  Object.entries(dvrMap).forEach(([dvrId, stats]) => {
    const dvrRow = document.querySelector(`[data-dvr-id="${dvrId}"]`);
    if (!dvrRow) return;

    // Update Status Badge
    const badgeContainer = dvrRow.querySelector(".status-badge");
    if (badgeContainer) {
      if (stats.online) {
        badgeContainer.className = "status-badge inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-transparent dark:border-current/10";
        let innerHtml = '<i class="fas fa-circle-check mr-1.5 opacity-80"></i> Online';
        if(stats.activeCameras > 0) {
          innerHtml += `<span class="ml-1.5 pl-1.5 border-l border-current/20 text-[10px] uppercase font-bold tracking-wider opacity-90">${stats.activeCameras} Cam</span>`;
        }
        badgeContainer.innerHTML = innerHtml;
      } else {
        badgeContainer.className = "status-badge inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border border-transparent dark:border-current/10";
        badgeContainer.innerHTML = '<i class="fas fa-circle-exclamation mr-1.5 opacity-80"></i> Offline';
      }
    }

    // Update actions (View/Live View toggle)
    const actionsLinks = dvrRow.querySelectorAll("a[href^='/public/dvr/']");
    actionsLinks.forEach(link => {
       if(stats.online) {
         link.innerHTML = '<i class="fas fa-eye mr-1.5"></i> Live';
       } else {
         link.innerHTML = '<i class="fas fa-eye mr-1.5"></i> View';
       }
    });

    // Update live stream info
    const liveBox = dvrRow.querySelector(".live-stream-info");
    if (liveBox) {
      if (stats.cameras && stats.cameras.length > 0) {
        let streamsHtml = '<p class="text-gray-500 dark:text-gray-400 mb-1">Live Streams</p>';
        stats.cameras.forEach(c => {
           streamsHtml += `<p class="text-[11px] text-gray-700 dark:text-gray-300">${c.resolution || '—'} · ${c.fps || '--'} FPS · ${c.bitrate || '--'} kbps</p>`;
        });
        liveBox.innerHTML = streamsHtml;
      } else {
        liveBox.innerHTML = '<p class="text-gray-500 dark:text-gray-400 mb-1">Live Streams</p><p class="text-xs text-gray-400">No active streams</p>';
      }
    }
    
    // Update summary counts in the hidden details area
    const detailsContainer = dvrRow.querySelector('.additional-info');
    if(detailsContainer) {
       const statTexts = detailsContainer.querySelectorAll('p.font-medium');
       if(statTexts && statTexts.length >= 2) {
          // Find the "Total / Active" camera stats element by index. It should be the first font-medium p below the live box
          const camsP = Array.from(statTexts).find(p => p.textContent.includes('Total') || p.textContent.includes('Active'));
          if(camsP) {
             const totalMatch = camsP.textContent.match(/(\d+)\s+Total/);
             const total = totalMatch ? totalMatch[1] : 0;
             let newHtml = `${total} Total`;
             if(stats.activeCameras > 0) {
               newHtml += ` <span class="text-green-600 dark:text-green-400 ml-1">(${stats.activeCameras} Active)</span>`;
             }
             camsP.innerHTML = newHtml;
          }
          
          // Update Status detailed text
          const statusP = Array.from(statTexts).find(p => p.textContent.includes('Online') || p.textContent.includes('Offline'));
          if(statusP) {
             statusP.innerHTML = stats.online ? "Online ✓" : "Offline";
          }
       }
    }
  });
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", handleSearchQuery);
