import { useState } from 'react';
import {
  Box,
  Button,
  Stack,
  Heading,
  Text,
  Input,
  FormControl,
  FormLabel,
  Checkbox,
  Link,
  Alert,
  AlertIcon,
  useColorMode,
  useColorModeValue,
  IconButton,
  Spinner,
  Flex,
} from '@chakra-ui/react';
import { MoonIcon, SunIcon, ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { z } from 'zod';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
} from 'firebase/auth';

// === Firebase Setup ===
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  appId: "your-app-id",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Google and GitHub Providers
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

// === Types and Schema ===
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// === Custom Hook: useAuth ===
function useAuth() {
  const loginWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to log in');
    }
  };

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  };

  const loginWithGithub = async () => {
    try {
      await signInWithPopup(auth, githubProvider);
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign in with GitHub');
    }
  };

  return {
    loginWithEmail,
    loginWithGoogle,
    loginWithGithub,
  };
}

export default function App() {
  const [formData, setFormData] = useState<LoginFormValues>({
    email: '',
    password: '',
  });

  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { toggleColorMode, colorMode } = useColorMode();
  const { loginWithEmail, loginWithGoogle, loginWithGithub } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      loginSchema.parse(formData);
      await loginWithEmail(formData.email, formData.password);
      alert('Login successful!');
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else {
        setError(err.message || 'Something went wrong');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: 'google' | 'github') => {
    setError('');
    setIsLoading(true);
    try {
      if (provider === 'google') {
        await loginWithGoogle();
      } else {
        await loginWithGithub();
      }
      alert(`Signed in with ${provider}`);
    } catch (err: any) {
      setError(err.message || `Failed to sign in with ${provider}`);
    } finally {
      setIsLoading(false);
    }
  };

  const cardBg = useColorModeValue('white', 'gray.700');
  const inputBg = useColorModeValue('gray.50', 'gray.800');

  return (
    <Box
      minH="100vh"
      bg={useColorModeValue('gray.50', 'gray.900')}
      py={{ base: '6', md: '12' }}
      px="4"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Box
        bg={cardBg}
        p={8}
        borderRadius="xl"
        shadow="lg"
        maxW="md"
        w="full"
        transition="all 0.2s ease-in-out"
        _hover={{ transform: 'translateY(-4px)', shadow: 'xl' }}
      >
        {/* Toggle Theme */}
        <Flex justify="end" mb={4}>
          <IconButton
            aria-label="Toggle dark mode"
            icon={colorMode === 'dark' ? <SunIcon /> : <MoonIcon />}
            onClick={toggleColorMode}
            size="sm"
            variant="ghost"
          />
        </Flex>

        <Stack spacing={6} textAlign="center">
          <Heading size="lg" fontWeight="bold">
            Welcome Back
          </Heading>
          <Text color="gray.500">Sign in to your account</Text>
        </Stack>

        {error && (
          <Alert status="error" mt={4} rounded="md">
            <AlertIcon />
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack spacing={6} mt={6}>
            <FormControl id="email" isRequired>
              <FormLabel>Email Address</FormLabel>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                bg={inputBg}
                focusBorderColor="blue.500"
              />
            </FormControl>

            <FormControl id="password" isRequired>
              <FormLabel>Password</FormLabel>
              <div style={{ position: 'relative' }}>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  bg={inputBg}
                  focusBorderColor="blue.500"
                />
                <IconButton
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                  onClick={() => setShowPassword(!showPassword)}
                  size="sm"
                  variant="ghost"
                  position="absolute"
                  right="10px"
                  top="8px"
                />
              </div>
            </FormControl>

            <Stack direction="row" align="start" justify="space-between">
              <Checkbox isChecked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}>
                Remember me
              </Checkbox>
              <Link color="blue.500" fontSize="sm">
                Forgot password?
              </Link>
            </Stack>

            <Button
              type="submit"
              bg="blue.600"
              color="white"
              _hover={{ bg: 'blue.700' }}
              isLoading={isLoading}
              spinner={<Spinner size="sm" />}
              w="full"
              disabled={isLoading}
            >
              Sign In
            </Button>
          </Stack>
        </form>

        <Stack spacing={3} mt={6}>
          <Text textAlign="center" fontSize="sm" color="gray.500">
            Or continue with
          </Text>
          <Stack direction="row" spacing={3}>
            <Button flex="1" leftIcon={<GoogleIcon />} variant="outline" onClick={() => handleSocialSignIn('google')}>
              Google
            </Button>
            <Button flex="1" leftIcon={<GitHubIcon />} variant="outline" onClick={() => handleSocialSignIn('github')}>
              GitHub
            </Button>
          </Stack>
        </Stack>

        <Text textAlign="center" mt={6} fontSize="sm" color="gray.500">
          Don't have an account?{' '}
          <Link color="blue.500" href="/register">
            Sign up
          </Link>
        </Text>
      </Box>
    </Box>
  );
}

// === SVG Icons ===

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
  </svg>
);

const GitHubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 22.092 24 17.592 24 12.297c0-6.628-5.373-12-12-12" />
  </svg>
);
