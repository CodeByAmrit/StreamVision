document.addEventListener("DOMContentLoaded", function () {
  const themeToggleBtn = document.getElementById("theme-toggle");
  const darkIcon = document.getElementById("theme-toggle-dark-icon");
  const lightIcon = document.getElementById("theme-toggle-light-icon");
  const earth = document.getElementById("earth");


  // Function to apply the theme
  const setTheme = (isDark) => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      darkIcon.classList.add("hidden");
      lightIcon.classList.remove("hidden");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      lightIcon.classList.add("hidden");
      darkIcon.classList.remove("hidden");
      localStorage.setItem("theme", "light");
    }
  };

  // --- MODIFIED SECTION ---
  // Check for stored theme and set the default
  if (localStorage.getItem("theme") === "light") {
    // If user previously chose light mode, keep it light
    setTheme(false);
  } else {
    // For all other cases (first visit, or previously chose dark), default to dark
    setTheme(true);
  }
  // --- END MODIFIED SECTION ---

  // Toggle on button click
  themeToggleBtn.addEventListener("click", () => {
    const isCurrentlyDark = document.documentElement.classList.contains("dark");
    setTheme(!isCurrentlyDark);
  });
});
