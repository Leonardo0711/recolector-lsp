/**
 * ThemeController — Manages light/dark theme toggle with localStorage persistence.
 */
export class ThemeController {
    constructor() {
        this.html = document.documentElement;

        // Load saved preference or default to dark
        const saved = localStorage.getItem('lsp_theme');
        this.currentTheme = saved || 'dark';
        this.applyTheme(this.currentTheme, false);

        // Use event delegation to handle clicks on any .theme-switch, including dynamic ones
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.theme-switch');
            if (btn) {
                this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
                this.applyTheme(this.currentTheme, true);
                localStorage.setItem('lsp_theme', this.currentTheme);
            }
        });
    }

    applyTheme(theme, animate) {
        this.html.setAttribute('data-theme', theme);

        // Update all icons dynamically in the document
        document.querySelectorAll('.theme-switch').forEach(btn => {
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

