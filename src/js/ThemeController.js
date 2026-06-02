/**
 * ThemeController — Manages light/dark theme toggle with localStorage persistence.
 */
export class ThemeController {
    constructor() {
        this.themeSwitches = document.querySelectorAll('.theme-switch');
        this.html = document.documentElement;

        // Load saved preference or default to dark
        const saved = localStorage.getItem('lsp_theme');
        this.currentTheme = saved || 'dark';
        this.applyTheme(this.currentTheme, false);

        // Bind toggle with safety check for all instances
        this.themeSwitches.forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
                this.applyTheme(this.currentTheme, true);
                localStorage.setItem('lsp_theme', this.currentTheme);
            });
        });
    }

    applyTheme(theme, animate) {
        this.html.setAttribute('data-theme', theme);

        // Update all icons
        this.themeSwitches.forEach(btn => {
            const icon = btn.querySelector('.theme-icon');
            if (icon) {
                if (theme === 'light') {
                    icon.className = 'fa-solid fa-sun theme-icon';
                } else {
                    icon.className = 'fa-solid fa-moon theme-icon';
                }
            }
        });
    }
}

