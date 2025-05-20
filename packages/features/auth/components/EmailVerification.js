"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-check"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
'Verification Email Sent',
    description;
'Please check your email to verify your account.',
;
;
;
return className = require("react");
const AuthContext_1;
'Your email is verified.';
'Your email is not verified. Please verify your email to continue.';
/p> {!(user  = require("@/contexts / AuthContext;
");;
import useToast_1 from '@/hooks/useToast';
import Button_1 from '../ui/Button/Button.js';
const EmailVerification = () => {
    const { user, sendVerificationEmail } = react_1.default.useContext(AuthContext_1.AuthContext);
    const toast = (0, useToast_1.default)();
    const handleSendVerificationEmail = () => {
        sendVerificationEmail();
        toast({
            title, "space-y-4":  >
                className, "text-lg font-semibold":  > Email
        } / h2 >
            {}(user === null || user === void 0 ? void 0 == null || user === void 0 ? void 0 : user.emailVerified : ) && onClick, { handleSendVerificationEmail } >
            Resend, Verification, Email
            < /Button_1.Button>);
    };
    /div>;
    ;
};
exports.default = EmailVerification;
//# sourceMappingURL=EmailVerification.js.map
//# sourceMappingURL=EmailVerification.js.map