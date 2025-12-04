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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useReducer, useCallback } from 'react';
// Initial state
var initialState = {
    isInitialized: false,
    currentStep: 0,
    session: null,
    activeAgents: new Map(),
    conversationHistory: [],
    error: null
};
// Reducer function
function wizardReducer(state, action) {
    switch (action.type) {
        case 'INITIALIZE_SESSION':
            return __assign(__assign({}, state), { isInitialized: true, session: action.payload, error: null });
        case 'SET_STEP':
            return __assign(__assign({}, state), { currentStep: action.payload });
        case 'UPDATE_AGENTS':
            return __assign(__assign({}, state), { activeAgents: action.payload });
        case 'ADD_CONVERSATION':
            return __assign(__assign({}, state), { conversationHistory: __spreadArray(__spreadArray([], state.conversationHistory, true), [action.payload], false) });
        case 'UPDATE_SESSION_DATA':
            return __assign(__assign({}, state), { session: state.session ? __assign(__assign({}, state.session), { data: __assign(__assign({}, state.session.data), action.payload) }) : null });
        case 'SET_ERROR':
            return __assign(__assign({}, state), { error: action.payload });
        case 'CLEAR_ERROR':
            return __assign(__assign({}, state), { error: null });
        default:
            return state;
    }
}
// Create context
var WizardContext = createContext(null);
export function WizardProvider(_a) {
    var children = _a.children;
    var _b = useReducer(wizardReducer, initialState), state = _b[0], dispatch = _b[1];
    var initializeSession = useCallback(function (session) {
        dispatch({ type: 'INITIALIZE_SESSION', payload: session });
    }, []);
    var setStep = useCallback(function (step) {
        dispatch({ type: 'SET_STEP', payload: step });
    }, []);
    var updateAgents = useCallback(function (agents) {
        dispatch({ type: 'UPDATE_AGENTS', payload: agents });
    }, []);
    var addConversation = useCallback(function (conversation) {
        dispatch({
            type: 'ADD_CONVERSATION',
            payload: __assign(__assign({}, conversation), { timestamp: new Date() })
        });
    }, []);
    var updateSessionData = useCallback(function (data) {
        dispatch({ type: 'UPDATE_SESSION_DATA', payload: data });
    }, []);
    var clearError = useCallback(function () {
        dispatch({ type: 'CLEAR_ERROR' });
    }, []);
    return (_jsx(WizardContext.Provider, { value: {
            state: state,
            dispatch: dispatch,
            initializeSession: initializeSession,
            setStep: setStep,
            updateAgents: updateAgents,
            addConversation: addConversation,
            updateSessionData: updateSessionData,
            clearError: clearError
        }, children: children }));
}
// Custom hook to use the wizard context
export function useWizard() {
    var context = useContext(WizardContext);
    if (!context) {
        throw new Error('useWizard must be used within a WizardProvider');
    }
    return context;
}
