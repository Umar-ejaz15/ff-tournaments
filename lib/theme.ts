/**
 * Consistent Color Theme for ZP Battle Zone
 * 
 * Primary Colors:
 * - Accent: Yellow-400 (main brand color)
 * - Primary: Blue-600 (action buttons)
 * - Success: Green-600
 * - Warning: Yellow-500
 * - Danger: Red-500
 * 
 * Background Colors:
 * - Main: Gray-900/Black gradient
 * - Card: Gray-900/50 with border
 * - Hover: Gray-800
 * 
 * Text Colors:
 * - Primary: White
 * - Secondary: Gray-300
 * - Muted: Gray-400
 * 
 * - Accent: Yellow-400
 */

export const theme = {
  colors: {
    // Brand Colors
    accent: {
      primary: "text-yellow-400",
      bg: "bg-yellow-400",
      hover: "hover:bg-yellow-500",
      border: "border-yellow-400",
    },
    primary: {
      text: "text-blue-600",
      bg: "bg-blue-600",
      hover: "hover:bg-blue-700",
      border: "border-blue-600",
    },
    success: {
      text: "text-green-400",
      bg: "bg-green-600",
      hover: "hover:bg-green-700",
      border: "border-green-600",
    },
    warning: {
      text: "text-yellow-500",
      bg: "bg-yellow-500",
      hover: "hover:bg-yellow-600",
      border: "border-yellow-500",
    },
    danger: {
      text: "text-red-400",
      bg: "bg-red-600",
      hover: "hover:bg-red-700",
      border: "border-red-600",
    },
    // Background Colors
    background: {
      main: "bg-gradient-to-b from-gray-900 via-black to-gray-900",
      card: "bg-gray-900/50",
      hover: "bg-gray-800",
      border: "border-gray-800",
    },
    // Text Colors
    text: {
      primary: "text-white",
      secondary: "text-gray-300",
      muted: "text-gray-400",
      accent: "text-yellow-400",
    },
  },
  // Common component styles
  components: {
    button: {
      primary: "bg-blue-600 hover:bg-blue-700 text-white",
      accent: "bg-yellow-500 hover:bg-yellow-400 text-black",
      success: "bg-green-600 hover:bg-green-700 text-white",
      danger: "bg-red-600 hover:bg-red-700 text-white",
      outline: "border border-gray-700 hover:bg-gray-800 text-white",
    },
    card: "bg-gray-900/50 border border-gray-800 rounded-xl",
    input: "bg-gray-800 border border-gray-700 text-white placeholder-gray-500",
  },
} as const;

