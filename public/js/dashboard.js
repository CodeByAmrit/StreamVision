// StreamVision Dashboard JavaScript

// Initialize dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  setTimeout(() => {
    const introScreen = document.getElementById("introScreen");
    if (introScreen) {
      introScreen.style.pointerEvents = "none"; // ✅ THIS IS KEY
      introScreen.style.opacity = "0";

      setTimeout(() => {
        introScreen.remove(); // ✅ better than display:none
        localStorage.setItem("introShown", "true");
      }, 500);
    }
  }, 800);
});

// Dashboard initialization function
function initializeDashboard() {
  console.log("StreamVision Dashboard initialized");

  // Theme Toggle
  const themeToggle = document.getElementById("theme-toggle");
  const htmlElement = document.documentElement;

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      htmlElement.classList.toggle("dark");
      const isDark = htmlElement.classList.contains("dark");
      localStorage.setItem("theme", isDark ? "dark" : "light");

      // Update button icon
      const moonIcon = themeToggle.querySelector(".fa-moon");
      const sunIcon = themeToggle.querySelector(".fa-sun");

      if (moonIcon && sunIcon) {
        if (isDark) {
          moonIcon.classList.add("hidden");
          sunIcon.classList.remove("hidden");
        } else {
          moonIcon.classList.remove("hidden");
          sunIcon.classList.add("hidden");
        }
      }
    });

    // Set initial theme
    const savedTheme = localStorage.getItem("theme") || "dark";
    if (savedTheme === "dark") {
      htmlElement.classList.add("dark");
      const moonIcon = themeToggle.querySelector(".fa-moon");
      const sunIcon = themeToggle.querySelector(".fa-sun");
      if (moonIcon && sunIcon) {
        moonIcon.classList.add("hidden");
        sunIcon.classList.remove("hidden");
      }
    } else {
      htmlElement.classList.remove("dark");
    }
  }

  // Mobile Sidebar Toggle
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const sidebar = document.getElementById("logo-sidebar");

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener("click", () => {
      sidebar.classList.toggle("-translate-x-full");
      sidebar.classList.toggle("translate-x-0");
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener("click", (e) => {
      if (
        window.innerWidth < 640 &&
        !sidebar.contains(e.target) &&
        !sidebarToggle.contains(e.target) &&
        !sidebar.classList.contains("-translate-x-full")
      ) {
        sidebar.classList.add("-translate-x-full");
      }
    });
  }

  // User Dropdown Menu
  const userMenuBtn = document.getElementById("user-menu-btn");
  const userDropdown = document.getElementById("user-dropdown");

  if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle("hidden");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.classList.add("hidden");
      }
    });
  }

  // Notifications Button
  const notificationsBtn = document.getElementById("notifications-btn");
  if (notificationsBtn) {
    notificationsBtn.addEventListener("click", () => {
      // Show notifications modal or dropdown
      alert("Notifications feature will be implemented soon!");
    });
  }

  // Initialize tooltips
  initializeTooltips();

  // Animate cards on scroll
  initializeScrollAnimations();

  // Update live indicators
  updateLiveIndicators();

  // Start auto-refresh for live data
  startAutoRefresh();
}

// Tooltip initialization
function initializeTooltips() {
  const tooltipElements = document.querySelectorAll("[data-tooltip-target], [data-tooltip]");

  tooltipElements.forEach((element) => {
    element.addEventListener("mouseenter", function (e) {
      const tooltipText =
        this.getAttribute("data-tooltip") || this.getAttribute("data-tooltip-target");

      if (tooltipText) {
        const tooltip = document.createElement("div");
        tooltip.className =
          "fixed z-50 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm dark:bg-gray-700";
        tooltip.textContent = tooltipText;
        tooltip.style.top = e.clientY - 40 + "px";
        tooltip.style.left = e.clientX + "px";
        tooltip.id = "active-tooltip";

        document.body.appendChild(tooltip);
      }
    });

    element.addEventListener("mouseleave", function () {
      const tooltip = document.getElementById("active-tooltip");
      if (tooltip) {
        tooltip.remove();
      }
    });
  });
}

// Scroll animations for cards
function initializeScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Add initial styles to cards
  document.querySelectorAll(".card-hover").forEach((card, index) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(20px)";
    card.style.transition = "opacity 0.5s ease, transform 0.5s ease";
    card.style.transitionDelay = index * 0.1 + "s";

    observer.observe(card);
  });
}

// Update live indicators and status
function updateLiveIndicators() {
  const liveIndicators = document.querySelectorAll(".live-indicator");

  liveIndicators.forEach((indicator) => {
    // Add pulsing animation
    indicator.classList.add("animate-pulse");

    // Update status text if needed
    const statusText = indicator.nextElementSibling;
    if (statusText && statusText.classList.contains("status-text")) {
      statusText.textContent = "Live Now";
    }
  });

  // Update DVR status badges
  updateDVRStatus();
}

// Update DVR status dynamically
function updateDVRStatus() {
  // In a real application, this would fetch actual status from the server
  const dvrItems = document.querySelectorAll("[data-dvr-id]");

  dvrItems.forEach((item) => {
    const statusElement = item.querySelector(".dvr-status");
    if (statusElement) {
      // Simulate status changes (in real app, this would come from API)
      const isOnline = Math.random() > 0.3; // 70% chance of being online

      if (isOnline) {
        statusElement.className = "status-badge live";
        statusElement.innerHTML =
          '<div class="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div> ONLINE';
      } else {
        statusElement.className = "status-badge offline";
        statusElement.innerHTML =
          '<div class="w-2 h-2 rounded-full bg-red-500 mr-2"></div> OFFLINE';
      }
    }
  });
}

// Auto-refresh dashboard data
function startAutoRefresh() {
  // Refresh every 30 seconds
  setInterval(() => {
    refreshDashboardData();
  }, 30000);
}

// Fetch updated dashboard data
function refreshDashboardData() {
  console.log("Refreshing dashboard data...");

  // In a real application, you would fetch from your API
  // Example:
  // fetch('/api/dashboard/stats')
  //     .then(response => response.json())
  //     .then(data => updateDashboardStats(data))
  //     .catch(error => console.error('Error refreshing dashboard:', error));

  // For now, just update the indicators
  updateLiveIndicators();
}

// Update dashboard statistics
function updateDashboardStats(data) {
  // Update total locations
  const totalLocations = document.querySelector('[data-stat="locations"]');
  if (totalLocations && data.total_dvrs !== undefined) {
    totalLocations.textContent = data.total_dvrs;
  }

  // Update total cameras
  const totalCameras = document.querySelector('[data-stat="cameras"]');
  if (totalCameras && data.total_cameras !== undefined) {
    totalCameras.textContent = data.total_cameras;
  }

  // Update live streams
  const liveStreams = document.querySelector('[data-stat="streams"]');
  if (liveStreams && data.active_streams !== undefined) {
    liveStreams.textContent = data.active_streams;
  }
}

// Quick action handlers
function initializeQuickActions() {
  // Quick stream button
  const quickStreamBtn = document.querySelector('[data-action="quick-stream"]');
  if (quickStreamBtn) {
    quickStreamBtn.addEventListener("click", () => {
      window.location.href = "/camera/new";
    });
  }

  // Add DVR button
  const addDvrBtn = document.querySelector('[data-action="add-dvr"]');
  if (addDvrBtn) {
    addDvrBtn.addEventListener("click", () => {
      window.location.href = "/dvr/new";
    });
  }

  // View analytics button
  const analyticsBtn = document.querySelector('[data-action="analytics"]');
  if (analyticsBtn) {
    analyticsBtn.addEventListener("click", () => {
      window.location.href = "/analytics";
    });
  }
}

// Error handling
function handleDashboardError(error) {
  console.error("Dashboard error:", error);

  // Show error message to user
  const errorDiv = document.createElement("div");
  errorDiv.className =
    "fixed top-4 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg";
  errorDiv.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-exclamation-triangle mr-2"></i>
            <span>Error loading dashboard data. Please refresh the page.</span>
            <button class="ml-auto text-red-700 hover:text-red-900" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

  document.body.appendChild(errorDiv);

  // Auto-remove error after 5 seconds
  setTimeout(() => {
    if (errorDiv.parentNode) {
      errorDiv.remove();
    }
  }, 5000);
}

// Export functions for global use
window.initializeDashboard = initializeDashboard;
window.refreshDashboardData = refreshDashboardData;
window.updateDashboardStats = updateDashboardStats;
window.handleDashboardError = handleDashboardError;

// Initialize quick actions
document.addEventListener("DOMContentLoaded", initializeQuickActions);
