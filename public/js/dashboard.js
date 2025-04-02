
window.addEventListener('load', () => {
    setTimeout(() => {
        const introScreen = document.getElementById('introScreen');
        introScreen.style.transition = 'opacity 1s ease-out';
        introScreen.style.opacity = '0';
        setTimeout(() => {
            introScreen.style.display = 'none';
            localStorage.setItem('introShown', 'true');
        }, 1000);
    }, 1000);
});