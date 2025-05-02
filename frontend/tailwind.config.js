/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#D81F26", // Netflix-like red
                secondary: "#181818", // Dark background
                dark: "#000000",
                light: "#E5E5E5",
            },
        },
    },
    plugins: [],
} 