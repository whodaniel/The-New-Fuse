const showToast = (message, type = "default", opts = {}): any => {
    const theme = (localStorage === null || localStorage === void 0 ? void 0 : localStorage.getItem("theme")) || "default";
    const options = Object.assign({ position: "bottom-center", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: theme === "default" ? "dark" : "light" }, opts);
    if ((opts === null || opts === void 0 ? void 0 : opts.clear) === true)
        toast.dismiss();
    switch (type) {
        case "success":
            toast.success(message, options);
            break;
        case "error":
            toast.error(message, options);
            break;
        case "info":
            toast.info(message, options);
            break;
        case "warning":
            toast.warn(message, options);
            break;
        default:
            toast(message, options);
    }
};
export default showToast;
//# sourceMappingURL=toast.js.map