"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
import react_1 from 'react';
import react_router_dom_1 from 'react-router-dom';
import AuthContext_1 from '@/contexts/AuthContext';
import useApi_1 from '@/hooks/useApi';
import useToast_1 from '@/hooks/useToast';
import react_2 from '@chakra-ui/react';
import zod_1 from 'zod';
const passwordSchema = zod_1.z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');
const RegisterForm = () => {
    const navigate = (0, react_router_dom_1.useNavigate)();
    const { actions } = (0, AuthContext_1.useAuth)();
    const { callApi } = (0, useApi_1.useApi)();
    const { showToast } = (0, useToast_1.useToast)();
    const [formData, setFormData] = (0, react_1.useState)({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
    });
    const [errors, setErrors] = (0, react_1.useState)({});
    const [showPassword, setShowPassword] = (0, react_1.useState)(false);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [passwordStrength, setPasswordStrength] = (0, react_1.useState)(0);
    const validatePassword = (password) => {
        let strength = 0;
        if (password.length >= 8)
            strength += 20;
        if (password.match(/[A-Z]/))
            strength += 20;
        if (password.match(/[a-z]/))
            strength += 20;
        if (password.match(/[0-9]/))
            strength += 20;
        if (password.match(/[^A-Za-z0-9]/))
            strength += 20;
        return strength;
    };
    const validateForm = () => {
        const newErrors = {};
        if (!formData.email) {
            newErrors.email = 'Email is required';
        }
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        try {
            passwordSchema.parse(formData.password);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                newErrors.password = error.errors[0].message;
            }
        }
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        if (formData.name && formData.name.length < 2) {
            newErrors.name = 'Name must be at least 2 characters long';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => (Object.assign(Object.assign({}, prev), { [name]: value })));
        if (name === 'password') {
            setPasswordStrength(validatePassword(value));
        }
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
                endpoint: '/api/auth/register',
                method: 'POST',
                body: {
                    email: formData.email,
                    password: formData.password,
                    name: formData.name,
                },
            });
            if ((response === null || response === void 0 ? void 0 : response.user) && (response === null || response === void 0 ? void 0 : response.token)) {
                actions.updateUser(response.user, response.token);
                showToast({
                    type: 'success',
                    message: 'Registration successful! Please check your email for verification.',
                });
                navigate('/dashboard');
            }
        }
        catch (error) {
        }
        finally {
            setLoading(false);
        }
    };
    const getPasswordStrengthColor = (strength) => {
        if (strength <= 20)
            return 'red';
        if (strength <= 40)
            return 'orange';
        if (strength <= 60)
            return 'yellow';
        if (strength <= 80)
            return 'blue';
        return 'green';
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
    errors.name;
};
 >
    Name(Optional) < /FormLabel>
    < react_2.Input;
type = "text";
name = "name";
value = { formData, : .name };
onChange = { handleChange };
placeholder = "Enter your name";
autoComplete = "name" /  >
    { errors, : .name } < /FormErrorMessage>
    < /FormControl>
    < react_2.FormControl;
isInvalid = {};
errors.password;
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
autoComplete = "new-password" /  >
    aria - label;
{
    showPassword ? 'Hide password' : 'Show password';
}
icon = {} /  > ;
/>} onClick={() => setShowPassword(!showPassword)} variant="ghost" size="sm"/ >
    /InputRightElement>
    < /InputGroup>
    < react_2.FormErrorMessage > { errors, : .password } < /FormErrorMessage>;
{
    formData.password && value;
    {
        passwordStrength;
    }
    size = "xs";
    mt = { 2:  };
    colorScheme = {} /  >
        fontSize;
    "sm";
    color = "gray.500";
    mt = { 1:  } >
        Password;
    strength: {
        passwordStrength;
    }
     %
        /Text>
        < />;
}
/FormControl>
    < react_2.FormControl;
isInvalid = {};
errors.confirmPassword;
 >
    Confirm;
Password < /FormLabel>
    < react_2.InputGroup >
    type;
{
    showPassword ? 'text' : 'password';
}
name = "confirmPassword";
value = { formData, : .confirmPassword };
onChange = { handleChange };
placeholder = "Confirm your password";
autoComplete = "new-password" /  >
    aria - label;
{
    showPassword ? 'Hide password' : 'Show password';
}
icon = {} /  > ;
/>} onClick={() => setShowPassword(!showPassword)} variant="ghost" size="sm"/ >
    /InputRightElement>
    < /InputGroup>
    < react_2.FormErrorMessage > { errors, : .confirmPassword } < /FormErrorMessage>
    < /FormControl>
    < react_2.Button;
type = "submit";
colorScheme = "blue";
width = "100%";
isLoading = { loading };
loadingText = "Creating account..." >
    Create;
Account
    < /Button>
    < react_2.Text;
fontSize = "sm" >
    Already;
have;
an;
account ? { ' ':  }
    < react_2.Link : ;
color = "blue.500";
onClick = {}();
navigate('/login');
 >
    Sign in
    /Link>
    < /Text>
    < /VStack>
    < /form>
    < /Box>;
;
;
exports.default = RegisterForm;
//# sourceMappingURL=RegisterForm.js.map
//# sourceMappingURL=RegisterForm.js.map