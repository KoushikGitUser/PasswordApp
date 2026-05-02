/**
 * Theme Color Definitions
 * Contains all color schemes for light and dark modes
 */

export const lightColors = {
  // Background colors
  background: '#f5f5f5',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  modalBackground: '#ffffff',
  cardBackground: '#f9f9f9',
  cardBorder: '#e0e0e0',

  // Text colors
  text: '#000000',
  textSecondary: '#666666',
  textTertiary: '#999999',

  // Border colors
  border: '#e0e0e0',
  borderLight: '#f0f0f0',
  borderStrong: '#cccccc',

  // Input colors
  inputBackground: '#f5f5f5',
  inputBorder: '#d0d0d0',
  inputText: '#000000',
  inputPlaceholder: '#999999',

  // Button colors - White/Action buttons (light grey in dark, dark grey in light)
  whiteButtonBg: '#2a2a2a',
  whiteButtonBorder: '#939393',
  whiteButtonText: '#ffffff',

  // Red buttons (keep same in both modes)
  redButtonBg: 'red',
  redButtonBorder: '#ff9999',
  redButtonText: '#ffffff',

  // Cancel buttons
  cancelButtonBg: '#e8e8e8',
  cancelButtonBorder: '#cccccc',
  cancelButtonText: '#333333',

  // Category colors (adjusted for light mode)
  categoryBanking: '#ff9500',
  categoryBankingBg: '#fff5e6',
  categoryBankingBorder: '#ffcc80',

  categoryMail: '#ff3b30',
  categoryMailBg: '#ffe6e6',
  categoryMailBorder: '#ff9999',

  categorySocial: '#34c759',
  categorySocialBg: '#e6f7ed',
  categorySocialBorder: '#80dea0',

  categoryDeveloper: '#af52de',
  categoryDeveloperBg: '#f5ebfa',
  categoryDeveloperBorder: '#d9a8f0',

  categoryWifi: '#007aff',
  categoryWifiBg: '#e6f2ff',
  categoryWifiBorder: '#80bdff',

  // Card pill colors
  categoryPillBg: '#f0f0f0',
  categoryPillBorder: '#d0d0d0',

  // Accent colors
  accentGreen: '#00c76b',
  accentOrange: '#ff8c00',
  accentBlue: '#007aff',

  // Status colors
  success: '#00c76b',
  error: '#ff3b30',
  warning: '#ff9500',
  info: '#007aff',

  // Shadow
  shadowColor: '#000000',

  // Overlay
  overlayBackground: 'rgba(0, 0, 0, 0.5)',
  blurTint: 'light',
};

export const darkColors = {
  // Background colors
  background: '#000000',
  surface: '#1c1c1e',
  surfaceElevated: '#2c2c2e',
  modalBackground: '#202020',
  cardBackground: '#1c1c1c',
  cardBorder: '#2d2d2d',

  // Text colors
  text: '#ffffff',
  textSecondary: '#ebebf5',
  textTertiary: '#99999f',

  // Border colors
  border: '#3d3d3d',
  borderLight: '#2a2a2a',
  borderStrong: '#525252',

  // Input colors
  inputBackground: '#2a2a2a',
  inputBorder: '#3d3d3d',
  inputText: '#ffffff',
  inputPlaceholder: '#99999f',

  // Button colors - White/Action buttons
  whiteButtonBg: '#cfcfcf',
  whiteButtonBorder: '#ffffff',
  whiteButtonText: '#000000',

  // Red buttons (keep same in both modes)
  redButtonBg: 'red',
  redButtonBorder: '#ff9999',
  redButtonText: '#ffffff',

  // Cancel buttons
  cancelButtonBg: '#383838',
  cancelButtonBorder: '#525252',
  cancelButtonText: '#ffffff',

  // Category colors (current dark mode)
  categoryBanking: '#ff9500',
  categoryBankingBg: '#2b1800',
  categoryBankingBorder: '#643100',

  categoryMail: '#ff3b30',
  categoryMailBg: '#2b0900',
  categoryMailBorder: '#641400',

  categorySocial: '#34c759',
  categorySocialBg: '#0a2814',
  categorySocialBorder: '#165a2b',

  categoryDeveloper: '#af52de',
  categoryDeveloperBg: '#220f2b',
  categoryDeveloperBorder: '#4b1e64',

  categoryWifi: '#007aff',
  categoryWifiBg: '#00183d',
  categoryWifiBorder: '#00356b',

  // Card pill colors
  categoryPillBg: '#2c2c2c',
  categoryPillBorder: '#363636',

  // Accent colors
  accentGreen: '#00c76b',
  accentOrange: '#ff8c00',
  accentBlue: '#007aff',

  // Status colors
  success: '#00c787',
  error: '#ff3b30',
  warning: '#ff9500',
  info: '#007aff',

  // Shadow
  shadowColor: '#000000',

  // Overlay
  overlayBackground: 'rgba(0, 0, 0, 0.7)',
  blurTint: 'dark',
};

// Helper function to get category-specific colors based on theme
export const getCategoryColors = (category, isDark) => {
  const categoryColorMap = {
    'Banking': {
      accent: 'orange',
      bgDark: '#1f0f00',
      bgLight: '#fff5e6',
      borderDark: '#8a4300',
      borderLight: '#ffcc80',
      iconBgDark: '#3a1c00',
      iconBgLight: '#ffe0b3',
      iconBorderDark: '#884200',
      iconBorderLight: '#ffb366',
      pillBgDark: '#3a1c00',
      pillBgLight: '#ffe0b3',
      pillBorderDark: '#833f00',
      pillBorderLight: '#ffb366',
    },
    'Mail or ID': {
      accent: 'red',
      bgDark: '#230000',
      bgLight: '#ffe6e6',
      borderDark: '#950000',
      borderLight: '#ff9999',
      iconBgDark: '#430000',
      iconBgLight: '#ffcccc',
      iconBorderDark: '#970000',
      iconBorderLight: '#ff6666',
      pillBgDark: '#430000',
      pillBgLight: '#ffcccc',
      pillBorderDark: '#8f0000',
      pillBorderLight: '#ff6666',
    },
    'Developer': {
      accent: '#e00092',
      bgDark: '#230016',
      bgLight: '#f5ebfa',
      borderDark: '#800053',
      borderLight: '#d9a8f0',
      iconBgDark: '#3d0027',
      iconBgLight: '#ebd4f5',
      iconBorderDark: '#830055',
      iconBorderLight: '#c27de0',
      pillBgDark: '#3d0027',
      pillBgLight: '#ebd4f5',
      pillBorderDark: '#78004e',
      pillBorderLight: '#c27de0',
    },
    'Wifi': {
      accent: '#0098ff',
      bgDark: '#001229',
      bgLight: '#e6f2ff',
      borderDark: '#00459a',
      borderLight: '#80bdff',
      iconBgDark: '#002248',
      iconBgLight: '#cce5ff',
      iconBorderDark: '#00469b',
      iconBorderLight: '#4da6ff',
      pillBgDark: '#002248',
      pillBgLight: '#cce5ff',
      pillBorderDark: '#004394',
      pillBorderLight: '#4da6ff',
    },
    'Social': {
      accent: '#00c76b',
      bgDark: '#001e10',
      bgLight: '#e6f7ed',
      borderDark: '#007c42',
      borderLight: '#80dea0',
      iconBgDark: '#00351c',
      iconBgLight: '#ccf0dd',
      iconBorderDark: '#007a41',
      iconBorderLight: '#4dc97f',
      pillBgDark: '#00351c',
      pillBgLight: '#ccf0dd',
      pillBorderDark: '#00733d',
      pillBorderLight: '#4dc97f',
    },
    'Others': {
      accent: '#00cfbb',
      bgDark: '#001f1c',
      bgLight: '#e6f7f5',
      borderDark: '#008575',
      borderLight: '#80e0d6',
      iconBgDark: '#003d38',
      iconBgLight: '#ccf0ed',
      iconBorderDark: '#008475',
      iconBorderLight: '#4dd4c7',
      pillBgDark: '#003d38',
      pillBgLight: '#ccf0ed',
      pillBorderDark: '#008071',
      pillBorderLight: '#4dd4c7',
    },
  };

  const colors = categoryColorMap[category] || categoryColorMap['Others'];

  return {
    accent: colors.accent,
    bg: isDark ? colors.bgDark : colors.bgLight,
    border: isDark ? colors.borderDark : colors.borderLight,
    iconBg: isDark ? colors.iconBgDark : colors.iconBgLight,
    iconBorder: isDark ? colors.iconBorderDark : colors.iconBorderLight,
    pillBg: isDark ? colors.pillBgDark : colors.pillBgLight,
    pillBorder: isDark ? colors.pillBorderDark : colors.pillBorderLight,
  };
};
