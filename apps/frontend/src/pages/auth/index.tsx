"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
import react_1 from 'react';
import react_router_dom_1 from 'react-router-dom';
import core_1 from '@/components/core';
import useAuth_1 from '@/hooks/useAuth';
const Login = react_1.default.lazy(() => Promise.resolve().then(() => require('./Login')));
const Register = react_1.default.lazy(() => Promise.resolve().then(() => require('./Register')));
const ForgotPassword = react_1.default.lazy(() => Promise.resolve().then(() => require('./ForgotPassword')));
const ResetPassword = react_1.default.lazy(() => Promise.resolve().then(() => require('./ResetPassword')));
const SSO = react_1.default.lazy(() => Promise.resolve().then(() => require('./SSO')));
const AuthLayout = ({ children }) => {
    return (<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <core_1.Card className="w-full max-w-lg">
        <core_1.CardHeader className="space-y-1">
          <core_1.CardTitle className="text-2xl text-center font-bold">
            Welcome to The New Fuse
          </core_1.CardTitle>
        </core_1.CardHeader>
        <core_1.CardContent>{children}</core_1.CardContent>
      </core_1.Card>
    </div>);
};
const Auth = () => {
    const { isAuthenticated } = (0, useAuth_1.useAuth)();
    if (isAuthenticated) {
        return <react_router_dom_1.Navigate to="/" replace/>;
    }
    return (<react_router_dom_1.Routes>
      <react_router_dom_1.Route element={<AuthLayout />}>
        <react_router_dom_1.Route index element={<react_router_dom_1.Navigate to="/login" replace/>}/>
        <react_router_dom_1.Route path="login" element={<Login />}/>
        <react_router_dom_1.Route path="register" element={<Register />}/>
        <react_router_dom_1.Route path="forgot-password" element={<ForgotPassword />}/>
        <react_router_dom_1.Route path="reset-password/:token" element={<ResetPassword />}/>
        <react_router_dom_1.Route path="sso/:provider" element={<SSO />}/>
      </react_router_dom_1.Route>
    </react_router_dom_1.Routes>);
};
exports.default = Auth;
export {};
//# sourceMappingURL=index.js.map