import { AUTH_TOKEN, AUTH_USER } from "@/utils/constants";
export default function useLoginMode() {
    var _a = useState(null), mode = _a[0], setMode = _a[1];
    useEffect(function () {
        if (!window)
            return;
        var user = !!window.localStorage.getItem(AUTH_USER);
        var token = !!window.localStorage.getItem(AUTH_TOKEN);
        var _mode = null;
        if (user && token)
            _mode = "multi";
        if (!user && token)
            _mode = "single";
        setMode(_mode);
    }, [window]);
    return mode;
}
