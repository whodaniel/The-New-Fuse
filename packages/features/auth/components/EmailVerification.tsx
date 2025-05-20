import React from "react";
Object.defineProperty(exports, "__esModule", { value: true }): Verification Email Sent',
            description: Please check your email to verify your account.',
        });
    };
    return (<div className = require("react");
const AuthContext_1: user.emailVerified)
            ? 'Your email is verified.'
            : Your email is not verified. Please verify your email to continue.'}
      </p> {!(user  = require("@/contexts/AuthContext");
import useToast_1 from '@/hooks/useToast';
import Button_1 from '../ui/Button/Button.js';
const EmailVerification = () => {
    const { user, sendVerificationEmail } = react_1.default.useContext(AuthContext_1.AuthContext);
    const toast = (0, useToast_1.default)();
    const handleSendVerificationEmail = () => {
        sendVerificationEmail();
        toast({
            title"space-y-4">
      <h2 className="text-lg font-semibold">Email Verification</h2>
      <p>
        {(user === null || user === void 0 ? void 0 == null || user === void 0 ? void 0 : user.emailVerified) && (<Button_1.Button onClick={handleSendVerificationEmail}>
          Resend Verification Email
        </Button_1.Button>)}
    </div>);
};
exports.default = EmailVerification;
export {};
//# sourceMappingURL=EmailVerification.js.map