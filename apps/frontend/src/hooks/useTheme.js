import { useState, useEffect } from "react";
var availableThemes = {
    default: "Default",
    light: "Light",
};
export function useTheme() {
    var _a = useState(function () {
        return localStorage.getItem("theme") || "default";
    }), theme = _a[0], _setTheme = _a[1];
    useEffect(function () {
        if (localStorage.getItem("theme") !== null)
            return;
        if (!window.matchMedia)
            return;
        if (window.matchMedia("(prefers-color-scheme: light)").matches)
            return _setTheme("light");
        _setTheme("default");
    }, []);
    useEffect(function () {
        document.documentElement.setAttribute("data-theme", theme);
        document.body.classList.toggle("light", theme === "light");
        localStorage.setItem("theme", theme);
        window.dispatchEvent(new Event(REFETCH_LOGO_EVENT));
    }, [theme]);
    useEffect(function () {
        if (!import.meta.env.DEV)
            return;
        function toggleOnKeybind(e) {
            if (e.metaKey && e.key === ".") {
                e.preventDefault();
                setTheme(function (prev) { return (prev === "light" ? "default" : "light"); });
            }
        }
        document.addEventListener("keydown", toggleOnKeybind);
        return function () { return document.removeEventListener("keydown", toggleOnKeybind); };
    }, []);
    function setTheme(newTheme) {
        _setTheme(newTheme);
    }
    return { theme: theme, setTheme: setTheme, availableThemes: availableThemes };
}
