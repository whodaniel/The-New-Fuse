declare const _default: {
    darkMode: string;
    content: {
        relative: boolean;
        files: string[];
    };
    theme: {
        extend: {
            rotate: {
                "270": string;
                "360": string;
            };
            colors: {
                "black-900": string;
                accent: string;
                "sidebar-button": string;
                sidebar: string;
                "historical-msg-system": string;
                "historical-msg-user": string;
                outline: string;
                "primary-button": string;
                secondary: string;
                "dark-input": string;
                "mobile-onboarding": string;
                "dark-highlight": string;
                "dark-text": string;
                description: string;
                "x-button": string;
                royalblue: string;
                purple: string;
                magenta: string;
                danger: string;
                error: string;
                warn: string;
                success: string;
                darker: string;
                theme: {
                    bg: {
                        primary: string;
                        secondary: string;
                        sidebar: string;
                        container: string;
                        chat: string;
                        "chat-input": string;
                    };
                    text: {
                        primary: string;
                        secondary: string;
                    };
                    sidebar: {
                        item: {
                            default: string;
                            selected: string;
                            hover: string;
                        };
                        subitem: {
                            default: string;
                            selected: string;
                            hover: string;
                        };
                        footer: {
                            icon: string;
                            'icon-hover': string;
                        };
                        border: string;
                    };
                    "chat-input": {
                        border: string;
                    };
                    "action-menu": {
                        bg: string;
                        "item-hover": string;
                    };
                    settings: {
                        input: {
                            bg: string;
                            active: string;
                            placeholder: string;
                            text: string;
                        };
                    };
                    modal: {
                        border: string;
                    };
                    "file-picker": {
                        hover: string;
                    };
                };
            };
            backgroundImage: {
                "preference-gradient": string;
                "chat-msg-user-gradient": string;
                "selected-preference-gradient": string;
                "main-gradient": string;
                "modal-gradient": string;
                "sidebar-gradient": string;
                "login-gradient": string;
                "menu-item-gradient": string;
                "menu-item-selected-gradient": string;
                "workspace-item-gradient": string;
                "workspace-item-selected-gradient": string;
                "switch-selected": string;
            };
            fontFamily: {
                sans: string[];
            };
            animation: {
                sweep: string;
                "pulse-glow": string;
            };
            keyframes: {
                sweep: {
                    "0%": {
                        transform: string;
                        transformOrigin: string;
                    };
                    "100%": {
                        transform: string;
                        transformOrigin: string;
                    };
                };
                fadeIn: {
                    "0%": {
                        opacity: number;
                    };
                    "100%": {
                        opacity: number;
                    };
                };
                fadeOut: {
                    "0%": {
                        opacity: number;
                    };
                    "100%": {
                        opacity: number;
                    };
                };
                "pulse-glow": {
                    "0%": {
                        opacity: number;
                        transform: string;
                        boxShadow: string;
                        backgroundColor: string;
                    };
                    "50%": {
                        opacity: number;
                        transform: string;
                        boxShadow: string;
                        backgroundColor: string;
                    };
                    "100%": {
                        opacity: number;
                        transform: string;
                        boxShadow: string;
                        backgroundColor: string;
                    };
                };
            };
        };
    };
    variants: {
        extend: {
            backgroundColor: string[];
            textColor: string[];
        };
    };
    safelist: ({
        pattern: RegExp;
        variants: string[];
    } | {
        pattern: RegExp;
        variants?: undefined;
    })[];
    plugins: (({ addVariant }: {
        addVariant: any;
    }) => void)[];
};
export default _default;
