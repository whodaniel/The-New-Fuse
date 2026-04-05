import * as React from "react";
const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 1000;
const actionTypes = {
    ADD_TOAST: "ADD_TOAST",
    UPDATE_TOAST: "UPDATE_TOAST",
    DISMISS_TOAST: "DISMISS_TOAST",
    REMOVE_TOAST: "REMOVE_TOAST",
};
let count = 0;
function genId() {
    count = (count + 1) % Number.MAX_VALUE;
    return count.toString();
}
const toastTimeouts = new Map();
const addToRemoveQueue = (toastId) => {
    if (toastTimeouts.has(toastId)) {
        return;
    }
    const timeout = setTimeout(() => {
        toastTimeouts.delete(toastId);
        dispatch({
            type: actionTypes.REMOVE_TOAST,
            toastId: toastId,
        });
    }, TOAST_REMOVE_DELAY);
    toastTimeouts.set(toastId, timeout);
};
export const reducer = (state, action) => {
    switch (action.type) {
        case actionTypes.ADD_TOAST:
            return {
                ...state,
                toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
            };
        case actionTypes.UPDATE_TOAST:
            return {
                ...state,
                toasts: state.toasts.map((t) => t.id === action.toast.id ? { ...t, ...action.toast } : t),
            };
        case actionTypes.DISMISS_TOAST: {
            const { toastId } = action;
            if (toastId) {
                addToRemoveQueue(toastId);
            }
            else {
                state.toasts.forEach((toast) => {
                    addToRemoveQueue(toast.id);
                });
            }
            return {
                ...state,
                toasts: state.toasts.map((t) => t.id === toastId || toastId === undefined
                    ? {
                        ...t,
                        open: false,
                    }
                    : t),
            };
        }
        case actionTypes.REMOVE_TOAST:
            if (action.toastId === undefined) {
                return {
                    ...state,
                    toasts: [],
                };
            }
            return {
                ...state,
                toasts: state.toasts.filter((t) => t.id !== action.toastId),
            };
    }
};
const listeners = [];
let memoryState = { toasts: [] };
function dispatch(action) {
    memoryState = reducer(memoryState, action);
    listeners.forEach((listener) => {
        listener(memoryState);
    });
}
export function useToast() {
    const [toasts, setToasts] = React.useState([]);
    const toast = (props) => {
        const id = genId();
        const update = (props) => dispatch({
            type: actionTypes.UPDATE_TOAST,
            toast: { ...props, id },
        });
        const dismiss = () => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id });
        // Create the toast object with safe typing
        const toastToAdd = {
            ...props,
            id,
            open: true,
            onOpenChange: (open) => {
                if (!open)
                    dismiss();
            },
        };
        dispatch({
            type: actionTypes.ADD_TOAST,
            toast: toastToAdd,
        });
        return {
            id: id,
            dismiss,
            update,
        };
    };
    const dismiss = (toastId) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId });
    const update = (toastId, props) => dispatch({
        type: actionTypes.UPDATE_TOAST,
        toast: { ...props, id: toastId },
    });
    React.useEffect(() => {
        const handleToasts = (state) => {
            setToasts([...state.toasts]);
        };
        listeners.push(handleToasts);
        return () => {
            const index = listeners.indexOf(handleToasts);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        };
    }, []);
    return {
        toast,
        dismiss,
        toasts,
    };
}
