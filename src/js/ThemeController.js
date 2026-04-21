/**
 * ThemeController — Manages light/dark theme toggle with localStorage persistence.
 */
export class ThemeController {
    constructor() {
        this.themeSwitch = document.getElementById('themeSwitch');
        this.themeIcon = document.getElementById('themeIcon');
        this.html = document.documentElement;

        // Load saved preference or default to dark
        const saved = localStorage.getItem('lsp_theme');
        this.currentTheme = saved || 'dark';
        this.applyTheme(this.currentTheme, false);

        // Bind toggle with safety check
        if (this.themeSwitch) {
            this.themeSwitch.addEventListener('click', () => {
                this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
                this.applyTheme(this.currentTheme, true);
                localStorage.setItem('lsp_theme', this.currentTheme);
            });
        }
    }

    applyTheme(theme, animate) {
        this.html.setAttribute('data-theme', theme);

        if (theme === 'light') {
            this.themeIcon.className = 'fa-solid fa-sun';
        } else {
            this.themeIcon.className = 'fa-solid fa-moon';
        }
    }
}
