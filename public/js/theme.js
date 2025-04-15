document.addEventListener('DOMContentLoaded', function () {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const darkIcon = document.getElementById('theme-toggle-dark-icon');
    const lightIcon = document.getElementById('theme-toggle-light-icon');

    // Check for stored theme
    const userPref = localStorage.getItem('theme');
    const systemPrefDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const setTheme = (isDark) => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            darkIcon.classList.add('hidden');
            lightIcon.classList.remove('hidden');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            lightIcon.classList.add('hidden');
            darkIcon.classList.remove('hidden');
            localStorage.setItem('theme', 'light');
        }
    };

    // Initialize theme
    if (userPref === 'dark' || (!userPref && systemPrefDark)) {
        setTheme(true);
    } else {
        setTheme(false);
    }

    // Toggle on button click
    themeToggleBtn.addEventListener('click', () => {
        const isCurrentlyDark = document.documentElement.classList.contains('dark');
        setTheme(!isCurrentlyDark);
    });
});

