document.addEventListener("DOMContentLoaded", function () {
  const darkIcon = document.getElementById("theme-toggle-dark-icon");
  const lightIcon = document.getElementById("theme-toggle-light-icon");

  // Always set dark theme
  document.documentElement.classList.add("dark");
  darkIcon.classList.add("hidden");
  lightIcon.classList.remove("hidden");

  // Optionally store in localStorage (though always dark)
  localStorage.setItem("theme", "dark");

  // Disable toggle button if present
  const themeToggleBtn = document.getElementById("theme-toggle");
  if (themeToggleBtn) themeToggleBtn.style.display = "none";
});
