// tailwind.config.js
module.exports = {
	content: [
	  './app/**/*.{js,ts,jsx,tsx}',
	  './components/**/*.{js,ts,jsx,tsx}',
	],
	theme: {
	  extend: {
		colors: {
		  offblack: '#333333',
		  offwhite: '#f8f8f8',
		  primary: '#FF6B6B', // adjust primary color as desired
		},
		keyframes: {
		  fadeIn: {
			'0%': { opacity: 0, transform: 'translateY(10px)' },
			'100%': { opacity: 1, transform: 'translateY(0)' },
		  },
		},
		animation: {
		  fadeIn: 'fadeIn 0.5s ease-out forwards',
		},
	  },
	},
	plugins: [],
	  // ...
	  theme: {
		extend: {
		  keyframes: {
			slideDown: {
			  "0%": { opacity: 0, transform: "translateY(-10px)" },
			  "100%": { opacity: 1, transform: "translateY(0)" },
			},
		  },
		  animation: {
			slideDown: "slideDown 0.3s ease-out forwards",
		  },
		},
	  },
	  // ...
  };
  