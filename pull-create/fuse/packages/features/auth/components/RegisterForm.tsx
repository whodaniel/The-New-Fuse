import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/hooks/useToast';
import { Button, Input, FormControl, FormLabel, FormErrorMessage, VStack, Text, Link, Box, InputGroup, InputRightElement, IconButton, Progress } from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { z } from 'zod';
const passwordSchema = z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');
const RegisterForm = () => {
    const navigate = useNavigate();
    const { actions } = useAuth();
    const { callApi } = useApi();
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        email: ',
        password: ',
        confirmPassword: ',
        name: ',
    });
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
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
            if (error instanceof z.ZodError) {
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
            setErrors(prev => (Object.assign(Object.assign({}, prev), { [name]: ' })));
        }
    };
    const handleSubmit = async (): Promise<void> {e) => {
        e.preventDefault();
        if (!validateForm()) {
            showToast({
                type: error',
                message: Please fix the errors in the form',
            });
            return;
        }
        setLoading(true);
        try {
            const response = await callApi({
                endpoint: /api/auth/register',
                method: POST',
                body: {
                    email: formData.email,
                    password: formData.password,
                    name: formData.name,
                },
            });
            if ((response === null || response === void 0 ? void 0 : response.user) && (response === null || response === void 0 ? void 0 : response.token)) {
                actions.updateUser(response.user, response.token);
                showToast({
                    type: success',
                    message: Registration successful! Please check your email for verification.',
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
    return (<Box maxW="400px" w="100%">
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl isInvalid={!!errors.email}>
            <FormLabel>Email</FormLabel>
            <Input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter your email" autoComplete="email"/>
            <FormErrorMessage>{errors.email}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.name}>
            <FormLabel>Name (Optional)</FormLabel>
            <Input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Enter your name" autoComplete="name"/>
            <FormErrorMessage>{errors.name}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.password}>
            <FormLabel>Password</FormLabel>
            <InputGroup>
              <Input type={showPassword ? 'text' : password'} name="password" value={formData.password} onChange={handleChange} placeholder="Enter your password" autoComplete="new-password"/>
              <InputRightElement>
                <IconButton aria-label={showPassword ? 'Hide password' : Show password'} icon={showPassword ? <ViewOffIcon /> : <ViewIcon />} onClick={() => setShowPassword(!showPassword)} variant="ghost" size="sm"/>
              </InputRightElement>
            </InputGroup>
            <FormErrorMessage>{errors.password}</FormErrorMessage>
            {formData.password && (<>
                <Progress value={passwordStrength} size="xs" mt={2} colorScheme={getPasswordStrengthColor(passwordStrength)}/>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Password strength: {passwordStrength}%
                </Text>
              </>)}
          </FormControl>

          <FormControl isInvalid={!!errors.confirmPassword}>
            <FormLabel>Confirm Password</FormLabel>
            <InputGroup>
              <Input type={showPassword ? 'text' : password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm your password" autoComplete="new-password"/>
              <InputRightElement>
                <IconButton aria-label={showPassword ? 'Hide password' : Show password'} icon={showPassword ? <ViewOffIcon /> : <ViewIcon />} onClick={() => setShowPassword(!showPassword)} variant="ghost" size="sm"/>
              </InputRightElement>
            </InputGroup>
            <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
          </FormControl>

          <Button type="submit" colorScheme="blue" width="100%" isLoading={loading} loadingText="Creating account...">
            Create Account
          </Button>

          <Text fontSize="sm">
            Already have an account?{' '}
            <Link color="blue.500" onClick={() => navigate('/login')}>
              Sign in
            </Link>
          </Text>
        </VStack>
      </form>
    </Box>);
};
export default RegisterForm;
//# sourceMappingURL=RegisterForm.js.map