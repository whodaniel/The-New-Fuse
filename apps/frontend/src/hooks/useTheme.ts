import { useState, useEffect } from "react";
const availableThemes = {
    default: "Default",
    light: "Light",
};
export function useTheme(): any {
    const [theme, _setTheme] = useState(() => {
        return localStorage.getItem("theme") || "default";
    });
    useEffect(() => {
        if (localStorage.getItem("theme") !== null)
            return;
        if (!window.matchMedia)
            return;
        if (window.matchMedia("(prefers-color-scheme: light)").matches)
            return _setTheme("light");
        _setTheme("default");
    }, []);
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        document.body.classList.toggle("light", theme === "light");
        localStorage.setItem("theme", theme);
        window.dispatchEvent(new Event(REFETCH_LOGO_EVENT));
    }, [theme]);
    useEffect(() => {
        if (!import.meta.env.DEV)
            return;
        function toggleOnKeybind(e): any {
            if (e.metaKey && e.key === ".") {
                e.preventDefault();
                setTheme((prev) => (prev === "light" ? "default" : "light"));
            }
        }
        document.addEventListener("keydown", toggleOnKeybind);
        return () => document.removeEventListener("keydown", toggleOnKeybind);
    }, []);
    function setTheme(newTheme): any {
        _setTheme(newTheme);
    }
    return { theme, setTheme, availableThemes };
}
//# sourceMappingURL=useTheme.js.map