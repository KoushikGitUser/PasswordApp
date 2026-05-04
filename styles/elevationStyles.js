// Centralized elevation and shadow styles
// Change values here to update elevation across the entire app

export const ELEVATION_LEVELS = {
  small: 5,
  medium: 10,
  large: 20,
};

export const SHADOW_COLORS = {
  light: {
    shadowColor: '#808080',
    shadowOpacity: 0.1,
  },
  dark: {
    shadowColor: '#000',
    shadowOpacity: 0.3,
  },
};

// Helper function to get elevation style
export const getElevation = (level = 'medium', isDark = false) => {
  const elevationValue = ELEVATION_LEVELS[level] || ELEVATION_LEVELS.medium;
  const shadowConfig = isDark ? SHADOW_COLORS.dark : SHADOW_COLORS.light;

  return {
    elevation: elevationValue, // Android
    // iOS shadow
    shadowColor: shadowConfig.shadowColor,
    shadowOffset: {
      width: 0,
      height: elevationValue / 2,
    },
    shadowOpacity: shadowConfig.shadowOpacity,
    shadowRadius: elevationValue / 2,
  };
};
