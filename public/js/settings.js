document.addEventListener('DOMContentLoaded', () => {
    const passwordForm = document.querySelector('form[action="/change-password"]');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const currentPassword = document.getElementById('current_password').value;
            const newPassword = document.getElementById('new_password').value;
            const confirmPassword = document.getElementById('confirm_password').value;

            if (newPassword !== confirmPassword) {
                showNotification('New passwords do not match.', 'error');
                return;
            }

            const response = await fetch('/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                    confirmPassword
                })
            });

            const result = await response.json();
            showNotification(result.message, result.status);

            if (result.status === 'success') {
                passwordForm.reset();
            }
        });
    }
});


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
  