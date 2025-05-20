"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
import react_1 from 'react';
import AuthContext_1 from '@/contexts/AuthContext';
import zod_1 from 'zod';
import react_hook_form_1 from 'react-hook-form';
import zod_2 from '@hookform/resolvers/zod';
import useToast_1 from '@/hooks/useToast';
import button_1 from '@/components/ui/button';
import card_1 from '@/components/ui/card';
import switch_1 from '@/components/ui/switch';
const verificationSchema = zod_1.z.object({
    code: zod_1.z
        .string()
        .length(6, 'Verification code must be 6 digits')
        .regex(/^\d+$/, 'Code must contain only numbers'),
});
const TwoFactorAuth = () => {
    const { user, setupTwoFactor, verifyTwoFactor, disableTwoFactor } = (0, AuthContext_1.useAuth)();
    const { toast } = (0, useToast_1.useModernToast)();
    const [isSettingUp, setIsSettingUp] = (0, react_1.useState)(false);
    const [qrCode, setQrCode] = (0, react_1.useState)(null);
    const [secret, setSecret] = (0, react_1.useState)(null);
    const [backupCodes, setBackupCodes] = (0, react_1.useState)([]);
    const [] = (0, react_1.useState)(false);
    const { register, handleSubmit, formState: { errors, isSubmitting }, reset, } = (0, react_hook_form_1.useForm)({
        resolver: (0, zod_2.zodResolver)(verificationSchema),
    });
    (0, react_1.useEffect)(() => {
        if (user === null || user === void 0 ? void 0 : user.twoFactorEnabled) {
            setIsSettingUp(false);
            setQrCode(null);
            setSecret(null);
        }
    }, [user === null || user === void 0 ? void 0 : user.twoFactorEnabled]);
    const handleSetup = async () => ;
    () => ;
    () => {
        try {
            setIsSettingUp(true);
            const response = await setupTwoFactor();
            setQrCode(response.qrCode);
            setSecret(response.secret);
            setBackupCodes(response.backupCodes.map((code) => ({
                code,
                used: false,
            })));
            toast({
                title: '2FA Setup Started',
                description: 'Scan the QR code with your authenticator app',
                variant: 'default',
            });
        }
        catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to setup 2FA',
                variant: 'destructive',
            });
            setIsSettingUp(false);
        }
    };
    const onVerify = async () => ;
    () => ;
    (data) => {
        try {
            await verifyTwoFactor(data.code);
            toast({
                title: 'Success',
                description: 'Two-factor authentication enabled successfully',
                variant: 'success',
            });
            reset();
            setIsSettingUp(false);
            setQrCode(null);
            setSecret(null);
        }
        catch (error) {
            toast({
                title: 'Error',
                description: 'Invalid verification code',
                variant: 'destructive',
            });
        }
    };
    const handleDisable = async () => ;
    () => ;
    () => {
        try {
            await disableTwoFactor();
            toast({
                title: 'Success',
                description: 'Two-factor authentication disabled',
                variant: 'success',
            });
        }
        catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to disable 2FA',
                variant: 'destructive',
            });
        }
    };
    const handleCopySecret = () => {
        if (secret) {
            navigator.clipboard.writeText(secret);
            toast({
                title: 'Copied',
                description: 'Secret copied to clipboard',
                variant: 'success',
            });
        }
    };
    const handleCopyBackupCodes = () => {
        const codes = backupCodes.map((code) => code.code).join('\n');
        navigator.clipboard.writeText(codes);
        toast({
            title: 'Copied',
            description: 'Backup codes copied to clipboard',
            variant: 'success',
        });
    };
    const handleDownloadBackupCodes = () => {
        const codes = backupCodes.map((code) => code.code).join('\n');
        const blob = new Blob([codes], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '2fa-backup-codes.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({
            title: 'Downloaded',
            description: 'Backup codes downloaded successfully',
            variant: 'success',
        });
    };
    return className = "max-w-md mx-auto" >
        className;
    "text-xl font-semibold" > Two - Factor;
    Authentication < /CardTitle>
        < /CardHeader>
        < card_1.CardContent;
    className = "space-y-6" >
        className;
    "flex items-center justify-between" >
        className;
    "space-y-1" >
        className;
    "text-sm font-medium" > Enable;
    2;
    FA < /h3>
        < p;
    className = "text-sm text-gray-500" >
        Add;
    an;
    extra;
    layer;
    of;
    security;
    to;
    your;
    account
        < /p>
        < /div>
        < switch_1.Switch;
    checked = {}(user === null || user === void 0 ? void 0 : user.twoFactorEnabled) || false;
}, onCheckedChange = {}(user === null || user === void 0 ? void 0 : user.twoFactorEnabled) ? handleDisable : handleSetup;
label = "Enable 2FA" /  >
    /div>;
{
    isSettingUp && qrCode && className;
    "space-y-6" >
        className;
    "mt-4 flex flex-col items-center" >
        className;
    "text-sm text-gray-600 mb-2" > Scan;
    this;
    code;
    with (your)
        authenticator;
    app: /p>
        < div;
    className = "p-4 bg-gray-100 rounded-lg" >
        className;
    "text-sm break-all" > { qrCode } < /code>
        < /div>
        < p;
    className = "text-xs text-gray-500 mt-2" > Or;
    manually;
    enter;
    the;
    code in your;
    authenticator;
    app < /p>
        < /div>;
    {
        secret && className;
        "space-y-2" >
            className;
        "text-sm text-gray-600" >
            If;
        you;
        can;
        't scan the QR code, enter this code manually:
            < /p>
            < div;
        className = "flex items-center space-x-2" >
            className;
        "flex-1 p-2 bg-gray-100 rounded font-mono text-sm" >
            { secret }
            < /code>
            < button_1.Button;
        variant = "outline";
        size = "sm";
        onClick = { handleCopySecret } >
            className;
        "h-4 w-4" /  >
            /Button>
            < /div>
            < /div>;
    }
    onSubmit;
    {
        handleSubmit(onVerify);
    }
    className = "space-y-4" >
        className;
    "space-y-2" >
        type;
    "text";
    placeholder = "Enter 6-digit code";
    {
        register('code');
    }
    aria - invalid;
    {
        !!errors.code;
    }
    aria - describedby;
    {
        errors.code ? 'code-error' : undefined;
    }
    />;
    {
        errors.code && id;
        "code-error";
        className = "text-sm text-red-500" >
            { errors, : .code.message }
            < /p>;
    }
    /div>
        < button_1.Button;
    type = "submit";
    className = "w-full";
    disabled = { isSubmitting } >
        {} >
        className;
    "mr-2 h-4 w-4 animate-spin" /  >
        Verifying;
    />;
    ('Verify');
}
/Button>
    < /form>;
{
    backupCodes.length > 0 && className;
    "space-y-4" >
        className;
    "flex items-center justify-between" >
        className;
    "text-sm font-medium" > Backup;
    Codes < /h4>
        < div;
    className = "flex space-x-2" >
        variant;
    "outline";
    size = "sm";
    onClick = { handleCopyBackupCodes } >
        className;
    "h-4 w-4" /  >
        /Button>
        < button_1.Button;
    variant = "outline";
    size = "sm";
    onClick = { handleDownloadBackupCodes } >
        className;
    "h-4 w-4" /  >
        /Button>
        < /div>
        < /div>
        < div;
    className = "grid grid-cols-2 gap-2" >
        { backupCodes, : .map((code, index) => key = { index }, className = "p-2 bg-gray-100 rounded font-mono text-sm text-center" >
                { code, : .code }
                < /code>) }
        < /div>
        < p;
    className = "text-sm text-gray-500" >
        Save;
    these;
    backup;
    codes in a;
    secure;
    place.You;
    can;
    use;
    them;
    to;
    access;
    your;
    account;
    if (you)
        lose;
    your;
    authenticator;
    device.
        < /p>
        < /div>;
}
/div>;
/CardContent>
    < /Card>;
;
;
exports.default = TwoFactorAuth;
//# sourceMappingURL=TwoFactorAuth.js.map