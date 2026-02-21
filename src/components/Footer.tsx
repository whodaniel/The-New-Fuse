import {
  Box,
  Container,
  SimpleGrid,
  Stack,
  Text,
  Link,
  IconButton,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaTwitter, FaGithub, FaLinkedin } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';

const links = [
  { name: 'Feature 1', href: '/feature-1' },
  { name: 'Feature 2', href: '/feature-2' },
  { name: 'Feature 3', href: '/feature-3' },
  { name: 'About Us', href: '/about' },
  { name: 'Careers', href: '/careers' },
  { name: 'Blog', href: '/blog' },
  { name: 'Help Center', href: '/help-center' },
  { name: 'Contact Us', href: '/contact' },
];

export function Footer() {
  const linkColor = useColorModeValue('gray.600', 'gray.400');
  const iconColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <Box bg={useColorModeValue('gray.50', 'gray.900')} color={useColorModeValue('gray.700', 'gray.200')}>
      <Container as="footer" maxW="6xl" py={16}>
        <SimpleGrid columns={{ sm: "1fr 1fr", md: "2fr 1fr 1fr 1fr" }} gap={8}>
          <Stack gap={6}>
            <Text fontSize="lg" fontWeight="bold">
              Company
            </Text>
            <Stack direction="row" gap={6}>
              <IconButton
                aria-label="Twitter"
                icon={<FaTwitter />}
                size="md"
                color={iconColor}
                variant="ghost"
                _hover={{ color: "brand.500" }}
              />
              <IconButton
                aria-label="GitHub"
                icon={<FaGithub />}
                size="md"
                color={iconColor}
                variant="ghost"
                _hover={{ color: "brand.500" }}
              />
              <IconButton
                aria-label="LinkedIn"
                icon={<FaLinkedin />}
                size="md"
                color={iconColor}
                variant="ghost"
                _hover={{ color: "brand.500" }}
              />
            </Stack>
          </Stack>
          {/* Links sections */}
          {['Product', 'Company', 'Support'].map((section) => (
            <Stack key={section}>
              <Text fontSize="lg" fontWeight="bold">
                {section}
              </Text>
              <Stack>
                {links.map((link) => (
                  <Link
                    key={link.name}
                    as={RouterLink}
                    to={link.href}
                    color={linkColor}
                    fontSize="sm"
                    _hover={{ color: "brand.500" }}
                  >
                    {link.name}
                  </Link>
                ))}
              </Stack>
            </Stack>
          ))}
        </SimpleGrid>
        <Box borderTopWidth={1} borderTopColor={useColorModeValue('gray.200', 'gray.700')} mt={8} pt={8}>
          <Stack direction={{ base: 'column', md: 'row' }} gap={4} justify="space-between" align="center">
            <Text fontSize="sm">
              © 2025 The New Fuse. All rights reserved.
            </Text>
            <Stack direction="row" gap={6}>
              <Text as={RouterLink} to="/privacy" fontSize="sm" color={linkColor} _hover={{ color: "brand.500" }}>
                Privacy
              </Text>
              <Text as={RouterLink} to="/terms" fontSize="sm" color={linkColor} _hover={{ color: "brand.500" }}>
                Terms
              </Text>
              <Text as={RouterLink} to="/contact" fontSize="sm" color={linkColor} _hover={{ color: "brand.500" }}>
                Contact
              </Text>
            </Stack>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}