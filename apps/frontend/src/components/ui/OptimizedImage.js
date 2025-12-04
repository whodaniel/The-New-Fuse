var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
export var OptimizedImage = function (_a) {
    var src = _a.src, alt = _a.alt, webpSrc = _a.webpSrc, srcSet = _a.srcSet, webpSrcSet = _a.webpSrcSet, sizes = _a.sizes, _b = _a.lazy, lazy = _b === void 0 ? true : _b, _c = _a.fadeIn, fadeIn = _c === void 0 ? true : _c, aspectRatio = _a.aspectRatio, _d = _a.objectFit, objectFit = _d === void 0 ? 'cover' : _d, placeholder = _a.placeholder, className = _a.className, onLoad = _a.onLoad, onError = _a.onError, props = __rest(_a, ["src", "alt", "webpSrc", "srcSet", "webpSrcSet", "sizes", "lazy", "fadeIn", "aspectRatio", "objectFit", "placeholder", "className", "onLoad", "onError"]);
    var _e = useState(false), isLoaded = _e[0], setIsLoaded = _e[1];
    var _f = useState(!lazy), isInView = _f[0], setIsInView = _f[1];
    var _g = useState(false), hasError = _g[0], setHasError = _g[1];
    var imgRef = useRef(null);
    // Intersection Observer for lazy loading
    useEffect(function () {
        if (!lazy || !imgRef.current)
            return;
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            });
        }, {
            rootMargin: '50px', // Start loading 50px before image enters viewport
            threshold: 0.01,
        });
        observer.observe(imgRef.current);
        return function () {
            observer.disconnect();
        };
    }, [lazy]);
    var handleLoad = function () {
        setIsLoaded(true);
        onLoad === null || onLoad === void 0 ? void 0 : onLoad();
    };
    var handleError = function () {
        setHasError(true);
        onError === null || onError === void 0 ? void 0 : onError();
    };
    var containerStyle = __assign({ position: 'relative', overflow: 'hidden' }, (aspectRatio && { aspectRatio: aspectRatio }));
    var imageStyle = {
        width: '100%',
        height: '100%',
        objectFit: objectFit,
        transition: fadeIn ? 'opacity 0.3s ease-in-out' : undefined,
        opacity: fadeIn ? (isLoaded ? 1 : 0) : 1,
    };
    var placeholderStyle = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#f0f0f0',
        backgroundImage: placeholder ? "url(".concat(placeholder, ")") : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(10px)',
        transform: 'scale(1.1)', // Slightly scale up to hide blur edges
        transition: 'opacity 0.3s ease-in-out',
        opacity: isLoaded ? 0 : 1,
        pointerEvents: 'none',
    };
    return (_jsxs("div", { ref: imgRef, style: containerStyle, className: cn('relative', className), children: [(fadeIn || placeholder) && !isLoaded && !hasError && (_jsx("div", { style: placeholderStyle, "aria-hidden": "true" })), isInView && !hasError && (_jsxs("picture", { children: [webpSrc && (_jsx("source", { type: "image/webp", srcSet: webpSrcSet || webpSrc, sizes: sizes })), srcSet && (_jsx("source", { srcSet: srcSet, sizes: sizes })), _jsx("img", __assign({ src: src, alt: alt, style: imageStyle, loading: lazy ? 'lazy' : 'eager', decoding: "async", onLoad: handleLoad, onError: handleError }, props))] })), hasError && (_jsx("div", { className: "flex items-center justify-center w-full h-full bg-gray-100 text-gray-400", role: "img", "aria-label": "Failed to load image: ".concat(alt), children: _jsx("svg", { className: "w-12 h-12", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", "aria-hidden": "true", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" }) }) }))] }));
};
// Helper function to generate responsive image srcSet
export var generateSrcSet = function (basePath, sizes, extension) {
    if (extension === void 0) { extension = 'jpg'; }
    return sizes.map(function (size) { return "".concat(basePath, "-").concat(size, "w.").concat(extension, " ").concat(size, "w"); }).join(', ');
};
// Helper function to generate WebP srcSet
export var generateWebPSrcSet = function (basePath, sizes) {
    return generateSrcSet(basePath, sizes, 'webp');
};
