"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
import react_1 from 'react';
import react_router_dom_1 from 'react-router-dom';
import AuthContext_1 from '@/contexts/AuthContext';
import useApi_1 from '@/hooks/useApi';
import useToast_1 from '@/hooks/useToast';
import react_2 from '@chakra-ui/react';
const LoginForm = () => {
    const navigate = (0, react_router_dom_1.useNavigate)();
    const { actions } = (0, AuthContext_1.useAuth)();
    const { callApi } = (0, useApi_1.useApi)();
    const { showToast } = (0, useToast_1.useToast)();
    const [formData, setFormData] = (0, react_1.useState)({
        email: '',
        password: '',
        rememberMe: false,
    });
    const [errors, setErrors] = (0, react_1.useState)({});
    const [showPassword, setShowPassword] = (0, react_1.useState)(false);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const validateForm = () => {
        const newErrors = {};
        if (!formData.email) {
            newErrors.email = 'Email is required';
        }
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        if (!formData.password) {
            newErrors.password = 'Password is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => (Object.assign(Object.assign({}, prev), { [name]: type === 'checkbox' ? checked : value })));
        if (errors[name]) {
            setErrors(prev => (Object.assign(Object.assign({}, prev), { [name]: '' })));
        }
    };
    const handleSubmit = async () => ;
    () => ;
    (e) => {
        e.preventDefault();
        if (!validateForm()) {
            showToast({
                type: 'error',
                message: 'Please fix the errors in the form',
            });
            return;
        }
        setLoading(true);
        try {
            const response = await callApi({
                endpoint: '/api/auth/login',
                method: 'POST',
                body: {
                    email: formData.email,
                    password: formData.password,
                },
            });
            if ((response === null || response === void 0 ? void 0 : response.user) && (response === null || response === void 0 ? void 0 : response.token)) {
                if (formData.rememberMe) {
                    localStorage.setItem('rememberMe', 'true');
                }
                actions.updateUser(response.user, response.token);
                showToast({
                    type: 'success',
                    message: 'Login successful! Redirecting to dashboard...',
                });
                setTimeout(() => {
                    navigate('/dashboard');
                }, 1000);
            }
        }
        catch (error) {
            showToast({
                type: 'error',
                message: error.message || 'Invalid email or password',
            });
        }
        finally {
            setLoading(false);
        }
    };
    const handleForgotPassword = () => {
        navigate('/forgot-password');
    };
    return maxW = "400px";
    w = "100%" >
        onSubmit;
    {
        handleSubmit;
    }
     >
        spacing;
    {
        4;
    }
     >
        isInvalid;
    {
        !!errors.email;
    }
     >
        Email < /FormLabel>
        < react_2.Input;
    type = "email";
    name = "email";
    value = { formData, : .email };
    onChange = { handleChange };
    placeholder = "Enter your email";
    autoComplete = "email" /  >
        { errors, : .email } < /FormErrorMessage>
        < /FormControl>
        < react_2.FormControl;
    isInvalid = {};
    errors.password;
};
 >
    Password < /FormLabel>
    < react_2.InputGroup >
    type;
{
    showPassword ? 'text' : 'password';
}
name = "password";
value = { formData, : .password };
onChange = { handleChange };
placeholder = "Enter your password";
autoComplete = "current-password" /  >
    aria - label;
{
    showPassword ? 'Hide password' : 'Show password';
}
icon = {} /  > ;
/>} onClick={() => setShowPassword(!showPassword)} variant="ghost" size="sm"/ >
    /InputRightElement>
    < /InputGroup>
    < react_2.FormErrorMessage > { errors, : .password } < /FormErrorMessage>
    < /FormControl>
    < react_2.HStack;
justify = "space-between";
width = "100%" >
    name;
"rememberMe";
isChecked = { formData, : .rememberMe };
onChange = { handleChange } >
    Remember;
me
    < /Checkbox>
    < react_2.Link;
color = "blue.500";
onClick = { handleForgotPassword };
fontSize = "sm" >
    Forgot;
password ?
    /Link>
        < /HStack>
        < react_2.Button : ;
type = "submit";
colorScheme = "blue";
width = "100%";
isLoading = { loading };
loadingText = "Signing in..." >
    Sign;
In
    < /Button>
    < react_2.Text;
fontSize = "sm" >
    Don;
't have an account?{';
'}
    < react_2.Link;
color = "blue.500";
onClick = {}();
navigate('/register');
 >
    Create;
one
    < /Link>
    < /Text>
    < /VStack>
    < /form>
    < /Box>;
;
;
exports.default = LoginForm;
//# sourceMappingURL=LoginForm.js.map
//# sourceMappingURL=LoginForm.js.map