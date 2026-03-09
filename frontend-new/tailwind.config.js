/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // Keep class strategy to prevent system dark mode
    theme: {
        extend: {
            colors: {
                "primary": "#1fdb64",
                "background-light": "#f6f8f7",
                "background-dark": "#112117",
                "surface-light": "#ffffff",
                "surface-dark": "#1c2e24",
                "text-main": "#111714",
                "text-secondary": "#648771",
            },
            fontFamily: {
                "display": ["Inter", "sans-serif"]
            },
        },
    },
    plugins: [],
}
