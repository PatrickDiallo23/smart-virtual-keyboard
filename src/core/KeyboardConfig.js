export const KeyboardConfig = {
    SIZES: {
        SMALL: { width: 600, height: 350, name: 'small' },
        MEDIUM: { width: 800, height: 350, name: 'medium' },
        LARGE: { width: 1000, height: 350, name: 'large' },
        FULL: { width: '100vw', height: '50vh', name: 'full' }
    },

    THEMES: ['light', 'dark', 'nature', 'sunset'],

    LAYOUTS: ['qwerty', 'azerty', 'german'],

    DEFAULTS: {
        size: 'medium',
        theme: 'light',
        autoComplete: true,
        soundEnabled: false,
        secureInput: true,
        currentLayout: 'qwerty'
    },

    CLIPBOARD: {
        MAX_ITEMS: 50,
        MIN_TEXT_LENGTH: 3
    },

    AI: {
        RATE_LIMIT_MS: 1000,
        DEFAULT_MODEL: 'gpt-4o-mini',
        MAX_TOKENS: {
            PROOFREAD: 500,
            CONTINUE: 150,
            SUGGEST: 100
        }
    },

    UI: {
        VIEWPORT_PADDING: 20,
        DRAG_THRESHOLD: 2,
        Z_INDEX: 2147483647
    },

    SHORTCUTS: {
        TOGGLE: { ctrl: true, shift: true, key: 'K' }
    }
};

export const THEME_ICONS = {
    light: '🌙',
    dark: '🌸',
    nature: '🌊',
    sunset: '☀️'
};

export const DEFAULT_COMMON_WORDS = [
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it'
];