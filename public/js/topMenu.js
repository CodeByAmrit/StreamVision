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
}

// Initialize dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {

  initializeDashboard();
});
