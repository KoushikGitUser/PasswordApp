/**
 * Centralized Button Styles
 *
 * This file contains all common button styling configurations.
 * Change styles here to apply across the entire application.
 *
 * Note: These are now theme-aware. Import { useTheme } from '../theme/ThemeContext'
 * and call getButtonStyles(colors) to get dynamic button styles.
 */

/**
 * Get theme-aware button styles
 * @param {Object} colors - Color scheme from theme context
 * @returns {Object} Button style configurations
 */
export const getButtonStyles = (colors) => ({
  // White/Light Gray Action Buttons (dynamic based on theme)
  whiteButton: {
    backgroundColor: colors.whiteButtonBg,
    borderWidth: 1.4,
    borderColor: colors.whiteButtonBorder,
    elevation: 10,
  },

  // Red Delete/Exit Buttons (same in both modes)
  redButton: {
    backgroundColor: colors.redButtonBg,
    borderWidth: 1.2,
    borderColor: colors.redButtonBorder,
    elevation: 10,
  },

  // Cancel Buttons (dynamic based on theme)
  cancelButton: {
    backgroundColor: colors.cancelButtonBg,
    borderWidth: 1,
    borderColor: colors.cancelButtonBorder,
    elevation: 10,
    
    
  },
});

// Legacy export for backward compatibility (dark mode defaults)
// Components should migrate to using getButtonStyles(colors) with theme context
export const buttonStyles = {
  whiteButton: {
    backgroundColor: "#cfcfcf",
    borderWidth: 1.4,
    borderColor: "#fff",
    elevation: 10,
  },
  redButton: {
    backgroundColor: "red",
    borderWidth: 1.2,
    borderColor: "#ff8383",
    elevation: 10,
  },
  cancelButton: {
    backgroundColor: "#383838",
    borderWidth: 1,
    borderColor: "#5a5a5a",
    elevation: 10,

  },
};
