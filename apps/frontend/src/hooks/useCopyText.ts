export default function useCopyText(delay = 2500): any {
    const [copied, setCopied] = useState(false);
    const copyText = async (content) => {
        var _a;
        if (!content)
            return;
        (_a = navigator === null || navigator === void 0 ? void 0 : navigator.clipboard) === null || _a === void 0 ? void 0 : _a.writeText(content);
        setCopied(content);
        setTimeout(() => {
            setCopied(false);
        }, delay);
    };
    return { copyText, copied };
}
//# sourceMappingURL=useCopyText.js.map