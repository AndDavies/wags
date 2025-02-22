// tailwind.config.js
module.exports = {
	darkMode: ['class'],
	content: [
	  './app/**/*.{js,ts,jsx,tsx}',
	  './components/**/*.{js,ts,jsx,tsx}',
	],
	theme: {
    	extend: {
    		colors: {
    			offblack: '#333333',
    			offwhite: '#f8f8f8',
    			primary: {
    				DEFAULT: 'hsl(var(--primary, 0, 100%, 66%))',
    				foreground: 'hsl(var(--primary-foreground, 0, 0%, 100%))'
    			},
    			secondary: {
    				DEFAULT: 'hsl(var(--secondary, 214, 70%, 56%))',
    				foreground: 'hsl(var(--secondary-foreground, 0, 0%, 100%))'
    			},
    			accent: {
    				DEFAULT: 'hsl(var(--accent, 39, 90%, 55%))',
    				foreground: 'hsl(var(--accent-foreground, 0, 0%, 100%))'
    			},
    			pet: {
    				DEFAULT: '#FF6B6B',
    				foreground: '#ffffff'
    			},
    			background: 'hsl(var(--background, 0, 0%, 100%))',
    			foreground: 'hsl(var(--foreground, 0, 0%, 0%))',
    			card: {
    				DEFAULT: 'hsl(var(--card, 0, 0%, 100%))',
    				foreground: 'hsl(var(--card-foreground, 0, 0%, 0%))'
    			},
    			popover: {
    				DEFAULT: 'hsl(var(--popover, 0, 0%, 100%))',
    				foreground: 'hsl(var(--popover-foreground, 0, 0%, 0%))'
    			},
    			muted: {
    				DEFAULT: 'hsl(var(--muted, 210, 16%, 82%))',
    				foreground: 'hsl(var(--muted-foreground, 210, 16%, 26%))'
    			},
    			destructive: {
    				DEFAULT: 'hsl(var(--destructive, 0, 78%, 63%))',
    				foreground: 'hsl(var(--destructive-foreground, 0, 0%, 100%))'
    			},
    			border: 'hsl(var(--border, 210, 16%, 82%))',
    			input: 'hsl(var(--input, 210, 16%, 97%))',
    			ring: 'hsl(var(--ring, 215, 20%, 65%))',
    			chart: {
    				'1': 'hsl(var(--chart-1))',
    				'2': 'hsl(var(--chart-2))',
    				'3': 'hsl(var(--chart-3))',
    				'4': 'hsl(var(--chart-4))',
    				'5': 'hsl(var(--chart-5))'
    			}
    		},
    		keyframes: {
    			fadeIn: {
    				'0%': {
    					opacity: 0,
    					transform: 'translateY(10px)'
    				},
    				'100%': {
    					opacity: 1,
    					transform: 'translateY(0)'
    				}
    			},
    			slideDown: {
    				'0%': {
    					opacity: 0,
    					transform: 'translateY(-10px)'
    				},
    				'100%': {
    					opacity: 1,
    					transform: 'translateY(0)'
    				}
    			},
    			'accordion-down': {
    				from: {
    					height: '0'
    				},
    				to: {
    					height: 'var(--radix-accordion-content-height)'
    				}
    			},
    			'accordion-up': {
    				from: {
    					height: 'var(--radix-accordion-content-height)'
    				},
    				to: {
    					height: '0'
    				}
    			}
    		},
    		animation: {
    			fadeIn: 'fadeIn 0.5s ease-out forwards',
    			slideDown: 'slideDown 0.3s ease-out forwards',
    			'accordion-down': 'accordion-down 0.2s ease-out',
    			'accordion-up': 'accordion-up 0.2s ease-out'
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		}
    	}
    },
	plugins: [
		require('@tailwindcss/typography'),
		require('tailwindcss-animate')
	],
  };
  