declare const routeConfig: ({
    path: string;
    element: import("react/jsx-runtime").JSX.Element;
    children?: undefined;
} | {
    path: string;
    element: import("react/jsx-runtime").JSX.Element;
    children: {
        path: string;
        element: import("react/jsx-runtime").JSX.Element;
    }[];
})[];
export default routeConfig;
