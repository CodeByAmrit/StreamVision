
document.getElementById("login_spinner").style.display = "none"; // Hide spinner on page load

document.getElementById('login-form').onsubmit = async function (e) {
    e.preventDefault();

    const email = this.email.value.trim();
    const password = this.password.value.trim();
    const loginBtn = this.querySelector('button[type="submit"]');

    // Show spinner loading button
    document.getElementById("login_spinner").style.display = "inline";

    try {
        loginBtn.disabled = true;

        const res = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }), // Include captcha token
        });

        const data = await res.json();

        if (data.status === 'success') {
            window.location.href = '/dashboard';
        } else {
            document.getElementById("login_spinner").style.display = "none";

            if (data.status === 'Invalid Password') {
                document.getElementById('password-error').classList.remove('hidden');
                document.getElementById('password').classList.add('border-red-500');
            } else if (data.status === 'Invalid email') {
                document.getElementById('email-error').classList.remove('hidden');
                document.getElementById('email').classList.add('border-red-500');
            } else if (data.status === 'captcha_failed') {
                alert("CAPTCHA verification failed. Please try again.");
            }
        }
    } catch (err) {
        console.error("Error in login process:", err);
        alert("Network error or CAPTCHA issue. Please try again.");
    } finally {
        loginBtn.disabled = false; // Re-enable button
    }
};
