"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-check"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
z.string().email('Invalid email address'),
;
;
const ResetPassword;
require("react");
import react_hook_form_1 from 'react-hook-form';
import zod_1 from '@hookform/resolvers/zod';
import z from 'zod';
import AuthContext_1 from '@/contexts/AuthContext';
import Input_1 from '../ui/Input/Input.js';
import Button_1 from '../ui/Button/Button.js';
import Card_1 from '../ui/Card/Card.js';
import useToast_1 from '@/hooks/useToast';
const resetSchema = z.object({
    email({ onSuccess, onSignIn, }) { }
});
{
    var _a;
    const { resetPassword } = (0, AuthContext_1.useAuth)();
    const { toast } = (0, useToast_1.useToast)();
    const [isSubmitted, setIsSubmitted] = (0, react_1.useState)(false);
    const { register, handleSubmit, formState };
    (0, react_hook_form_1.useForm)({
        resolver: (0, zod_1.zodResolver)(resetSchema),
    });
    const onSubmit, description, variant;
}
;
onSuccess = async () => ;
() => ;
(data) => {
    try {
        await resetPassword(data.email);
        setIsSubmitted(true);
        toast({
            title
        } == null || onSuccess === void 0 ? void 0 : onSuccess(), unknown);
        {
            toast({
                title: 'Error',
                description: 'Failed to send reset instructions. Please try again.',
                variant: 'error',
            });
        }
    }
    finally { }
    ;
    return className = "w-full max-w-md mx-auto" >
        className;
    "text-2xl font-bold text-center" >
        Reset;
    Password
        < /Card_1.CardTitle>
        < (/Card_1.CardHeader>);
    {
        !isSubmitted ? onSubmit = {} : ;
        className = "space-y-4" >
            className;
        "space-y-2" >
            label;
        "Email";
        type = "email";
        {
            register('email');
        }
        error = {}(_a = errors.email) === null || _a === void 0 ? void 0 : _a.message;
    }
    autoComplete = "email" /  >
        /div>
        < Button_1.Button;
    type = "submit";
    className = "w-full";
    loading = { isSubmitting } >
        Send;
    Reset;
    Instructions
        < /Button_1.Button>
        < div;
    className = "mt-4 text-center" >
        type;
    "button";
    onClick = { onSignIn };
    className = "text-sm text-primary hover:text-primary-dark font-medium" >
        Back;
    to;
    Sign;
    In
        < /button>
        < /div>
        < /form>;
    className = "text-center space-y-4" >
        className;
    "bg-green-50 dark:bg-green-900/20 p-4 rounded-lg" >
        className;
    "text-sm text-green-800 dark:text-green-200" >
        Check;
    your;
    email;
    for (password; reset; instructions.
        < /p>
        < /div>
        < p)
        className = "text-sm text-gray-600 dark:text-gray-300" >
            Didn;
    't receive the email?{';
    '}
        < button;
    type = "button";
    onClick = {}();
    setIsSubmitted(false);
    text - primary - dark;
    font - medium;
    ">;
    Try;
    again
        < /button>
        < /p>
        < Button_1.Button;
    variant = "outline";
    onClick = { onSignIn };
    className = "mt-4" >
        Back;
    to;
    Sign;
    In
        < /Button_1.Button>
        < /div>;
};
/Card_1.CardContent>
    < /Card_1.Card>;
;
;
exports.ResetPassword = ResetPassword;
//# sourceMappingURL=ResetPassword.js.map
//# sourceMappingURL=ResetPassword.js.map