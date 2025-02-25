/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ["class"],
	content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "*.{js,ts,jsx,tsx,mdx}"],
	theme: {
	  extend: {
		colors: {
		  offblack: "#333333",
		  offwhite: "#f8f8f8",
		  brand: {
			teal: "#30B8C4",
			pink: "#FFE5E5",
		  },
		  primary: {
			DEFAULT: "#30B8C4",
			foreground: "#FFFFFF",
		  },
		  secondary: {
			DEFAULT: "#FFE5E5",
			foreground: "#333333",
		  },
		  accent: {
			DEFAULT: "#FF6B6B",
			foreground: "#FFFFFF",
		  },
		  background: "hsl(var(--background))",
		  foreground: "hsl(var(--foreground))",
		  card: {
			DEFAULT: "hsl(var(--card))",
			foreground: "hsl(var(--card-foreground))",
		  },
		  popover: {
			DEFAULT: "hsl(var(--popover))",
			foreground: "hsl(var(--popover-foreground))",
		  },
		  muted: {
			DEFAULT: "hsl(var(--muted))",
			foreground: "hsl(var(--muted-foreground))",
		  },
		  destructive: {
			DEFAULT: "hsl(var(--destructive))",
			foreground: "hsl(var(--destructive-foreground))",
		  },
		  border: "hsl(var(--border))",
		  input: "hsl(var(--input))",
		  ring: "hsl(var(--ring))",
		},
		keyframes: {
		  fadeIn: {
			"0%": {
			  opacity: 0,
			  transform: "translateY(10px)",
			},
			"100%": {
			  opacity: 1,
			  transform: "translateY(0)",
			},
		  },
		  slideDown: {
			"0%": {
			  opacity: 0,
			  transform: "translateY(-10px)",
			},
			"100%": {
			  opacity: 1,
			  transform: "translateY(0)",
			},
		  },
		  "accordion-down": {
			from: { height: "0" },
			to: { height: "var(--radix-accordion-content-height)" },
		  },
		  "accordion-up": {
			from: { height: "var(--radix-accordion-content-height)" },
			to: { height: "0" },
		  },
		},
		animation: {
		  fadeIn: "fadeIn 0.5s ease-out forwards",
		  slideDown: "slideDown 0.3s ease-out forwards",
		  "accordion-down": "accordion-down 0.2s ease-out",
		  "accordion-up": "accordion-up 0.2s ease-out",
		},
		borderRadius: {
		  lg: "var(--radius)",
		  md: "calc(var(--radius) - 2px)",
		  sm: "calc(var(--radius) - 4px)",
		},
		fontFamily: {
		  sans: ["var(--font-outfit)"],
		  display: ["var(--font-pacifico)"],
		},
	  },
	},
	plugins: [require("@tailwindcss/typography"), require("tailwindcss-animate")],
  }
  
  