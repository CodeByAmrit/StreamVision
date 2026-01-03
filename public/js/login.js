// Integrated Login JavaScript

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Initialize form elements
  initializeLoginForm();

  // Handle URL parameters for error messages
  handleUrlParameters();
});

// Password visibility toggle
function initializeLoginForm() {
  const togglePasswordBtn = document.getElementById("toggle-password");
  const passwordInput = document.getElementById("password");

  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener("click", function () {
      const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
      passwordInput.setAttribute("type", type);

      // Toggle eye icon and text
      const icon = togglePasswordBtn.querySelector("i");
      if (type === "text") {
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
        togglePasswordBtn.innerHTML = '<i class="fas fa-eye-slash mr-1"></i> Hide';
      } else {
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
        togglePasswordBtn.innerHTML = '<i class="fas fa-eye mr-1"></i> Show';
      }
    });
  }

  // Form submission handler
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLoginSubmit);
  }
}

// Show flash message
function showFlashMessage(message, type = "error") {
  const flashMessage = document.getElementById("flash-message");

  if (!flashMessage) return;

  flashMessage.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${
              type === "success" ? "check-circle" : "exclamation-circle"
            } mr-3 text-${type === "success" ? "green" : "red"}-500"></i>
            <span class="${
              type === "success"
                ? "text-green-800 dark:text-green-200"
                : "text-red-800 dark:text-red-200"
            }">${message}</span>
            <button id="close-flash" class="ml-auto text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

  flashMessage.className = `slide-down mb-6 p-4 rounded-lg ${
    type === "success"
      ? "bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800"
      : "bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800"
  }`;
  flashMessage.classList.remove("hidden");

  // Add close button event
  document.getElementById("close-flash").addEventListener("click", () => {
    flashMessage.classList.add("hidden");
  });

  // Auto-hide after 5 seconds
  setTimeout(() => {
    flashMessage.classList.add("hidden");
  }, 5000);
}

// Reset error states
function resetErrorStates() {
  // Remove error borders from inputs
  document.getElementById("email")?.classList.remove("border-red-500", "dark:border-red-500");
  document.getElementById("password")?.classList.remove("border-red-500", "dark:border-red-500");

  // Hide error messages
  document.getElementById("email-error")?.classList.add("hidden");
  document.getElementById("password-error")?.classList.add("hidden");

  // Hide flash message
  document.getElementById("flash-message")?.classList.add("hidden");
}

// Handle login submission
async function handleLoginSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const email = form.email.value.trim();
  const password = form.password.value.trim();
  const remember = form.remember.checked;

  const submitBtn = document.getElementById("submit-btn");
  const btnText = document.getElementById("btn-text");
  const btnLoading = document.getElementById("btn-loading");

  // Reset error states
  resetErrorStates();

  // Basic validation
  if (!email || !password) {
    showFlashMessage("Please fill in all required fields", "error");
    return;
  }

  // Show loading state
  if (submitBtn && btnText && btnLoading) {
    btnText.classList.add("hidden");
    btnLoading.classList.remove("hidden");
    submitBtn.disabled = true;
    submitBtn.classList.remove("btn-gradient");
    submitBtn.classList.add("bg-gray-400", "cursor-not-allowed");
  }

  try {
    // Prepare data for submission
    const formData = {
      email,
      password,
      remember,
    };

    // Submit login request
    const res = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await res.json();

    if (data.status === "success") {
      // Successful login
      showFlashMessage("Login successful! Redirecting to dashboard...", "success");

      // Delay redirect to show success message
      setTimeout(() => {
        window.location.href = data.redirect || "/dashboard";
      }, 1000);
    } else {
      // Handle different error cases
      if (data.status === "Invalid Password") {
        document.getElementById("password-error")?.classList.remove("hidden");
        document.getElementById("password")?.classList.add("border-red-500", "dark:border-red-500");
        showFlashMessage("Incorrect password. Please try again.", "error");
      } else if (data.status === "Invalid email") {
        document.getElementById("email-error")?.classList.remove("hidden");
        document.getElementById("email")?.classList.add("border-red-500", "dark:border-red-500");
        showFlashMessage("Email not found. Please check your email address.", "error");
      } else if (data.message) {
        // Generic error message from server
        showFlashMessage(data.message, "error");
      } else {
        showFlashMessage("Login failed. Please try again.", "error");
      }
    }
  } catch (error) {
    console.error("Login error:", error);

    // Network error
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      showFlashMessage("Network error. Please check your connection and try again.", "error");
    } else {
      showFlashMessage("An unexpected error occurred. Please try again.", "error");
    }
  } finally {
    // Reset button state
    if (submitBtn && btnText && btnLoading) {
      btnText.classList.remove("hidden");
      btnLoading.classList.add("hidden");
      submitBtn.disabled = false;
      submitBtn.classList.remove("bg-gray-400", "cursor-not-allowed");
      submitBtn.classList.add("btn-gradient");
    }
  }
}

// Handle URL parameters for error messages
function handleUrlParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get("error");
  const message = urlParams.get("message");
  const status = urlParams.get("status");

  if (error || message || status) {
    // Show appropriate error message
    if (status === "Invalid Password") {
      document.getElementById("password-error")?.classList.remove("hidden");
      document.getElementById("password")?.classList.add("border-red-500", "dark:border-red-500");
      showFlashMessage(message || "Incorrect password. Please try again.", "error");
    } else if (status === "Invalid email") {
      document.getElementById("email-error")?.classList.remove("hidden");
      document.getElementById("email")?.classList.add("border-red-500", "dark:border-red-500");
      showFlashMessage(message || "Email not found. Please check your email address.", "error");
    } else if (message) {
      showFlashMessage(message, "error");
    }

    // Clear URL parameters without reloading
    const newUrl = window.location.pathname;
    window.history.replaceState({}, document.title, newUrl);
  }
}

// Initialize password strength on focus
document.getElementById("password")?.addEventListener("focus", function () {
  // Only initialize once
  if (!this.hasAttribute("data-strength-initialized")) {
    this.setAttribute("data-strength-initialized", "true");
  }
});

// Add input focus effects
document.querySelectorAll("#email, #password").forEach((input) => {
  input.addEventListener("focus", function () {
    this.classList.add("ring-2", "ring-blue-500/20");
  });

  input.addEventListener("blur", function () {
    this.classList.remove("ring-2", "ring-blue-500/20");
  });
});

// Auto-focus email field on page load (if not on mobile)
if (window.innerWidth > 768) {
  setTimeout(() => {
    document.getElementById("email")?.focus();
  }, 500);
}

// Handle Enter key to submit form
document.addEventListener("keydown", function (event) {
  if (event.key === "Enter" && !event.target.matches('button, [type="submit"]')) {
    const activeElement = document.activeElement;
    if (activeElement.matches("#email, #password")) {
      event.preventDefault();
      document.getElementById("login-form")?.requestSubmit();
    }
  }
});

// Make functions available globally
window.showFlashMessage = showFlashMessage;
window.resetErrorStates = resetErrorStates;
