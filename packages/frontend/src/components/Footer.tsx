import React from 'react';
import {
  Box,
  Container,
  Stack,
  Text,
  Link,
  SimpleGrid,
  useColorModeValue,
  IconButton,
} from '@chakra-ui/react';
import { FaTwitter, FaGithub, FaLinkedin } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';

export function Footer() {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const footerSections = [
    {
      title: 'Company',
      links: [
        { label: 'About', href: '/about' },
        { label: 'Careers', href: '/careers' },
        { label: 'Contact', href: '/contact' },
      ],
    },
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '/features' },
        { label: 'Pricing', href: '/pricing' },
        { label: 'Documentation', href: '/docs' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy', href: '/privacy' },
        { label: 'Terms', href: '/terms' },
        { label: 'License', href: '/license' },
      ],
    },
  ];

  return (
    <Box
      bg={bgColor}
      color={useColorModeValue('gray.700', 'gray.200')}
      borderTop={1}
      borderStyle="solid"
      borderColor={borderColor}
    >
      <Container maxW="container.xl" py={10}>
        <SimpleGrid
          templateColumns={{ sm: '1fr 1fr', md: '2fr 1fr 1fr 1fr' }}
          spacing={8}
        >
          <Stack spacing={6}>
            <Box>
              <Text fontSize="lg" fontWeight="bold">
                The New Fuse
              </Text>
            </Box>
            <Text fontSize="sm">
              Building the future of development tools.
            </Text>
            <Stack direction="row" spacing={6}>
              <IconButton
                aria-label="Twitter"
                icon={<FaTwitter />}
                size="md"
                color={useColorModeValue('gray.600', 'gray.300')}
                variant="ghost"
                _hover={{
                  color: 'brand.500',
                }}
              />
              <IconButton
                aria-label="GitHub"
                icon={<FaGithub />}
                size="md"
                color={useColorModeValue('gray.600', 'gray.300')}
                variant="ghost"
                _hover={{
                  color: 'brand.500',
                }}
              />
              <IconButton
                aria-label="LinkedIn"
                icon={<FaLinkedin />}
                size="md"
                color={useColorModeValue('gray.600', 'gray.300')}
                variant="ghost"
                _hover={{
                  color: 'brand.500',
                }}
              />
            </Stack>
          </Stack>
          {footerSections.map((section) => (
            <Stack key={section.title} align="flex-start">
              <Text fontWeight="semibold" color={useColorModeValue('gray.600', 'gray.400')}>
                {section.title}
              </Text>
              {section.links.map((link) => (
                <Link
                  key={link.label}
                  as={RouterLink}
                  to={link.href}
                  color={useColorModeValue('gray.600', 'gray.400')}
                  fontSize="sm"
                  _hover={{
                    color: 'brand.500',
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </Stack>
          ))}
        </SimpleGrid>
        <Text pt={8} fontSize="sm" textAlign="center">
          © {new Date().getFullYear()} The New Fuse. All rights reserved.
        </Text>
      </Container>
    </Box>
  );
}