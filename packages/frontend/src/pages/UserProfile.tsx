import React from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Avatar,
  Button,
  useColorModeValue,
  Container,
  SimpleGrid,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Badge,
  Icon,
  Flex,
  Spacer,
} from "@chakra-ui/react";
import {
  FiEdit2,
  FiMail,
  FiPhone,
  FiMapPin,
  FiBriefcase,
  FiAward,
  FiSave,
} from "react-icons/fi"; // Example icons
import { useAuthContext } from "../contexts/AuthContext";

const UserProfile: React.FC = () => {
  const { user } = useAuthContext();
  const cardBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  // Placeholder data if user is not available or for form fields
  const profileData = {
    name: user?.name || "John Doe",
    avatarUrl: "https://bit.ly/dan-abramov", // Placeholder avatar
    email: user?.email || "john.doe@example.com",
    phone: "123-456-7890",
    location: "New York, USA",
    bio: "Software Developer with a passion for creating amazing web applications. Loves coding, hiking, and photography.",
    title: "Senior Software Engineer",
    company: "Tech Solutions Inc.",
    skills: ["React", "TypeScript", "Node.js", "GraphQL", "Chakra UI"],
    interests: ["Open Source", "AI/ML", "Photography"],
  };

  // In a real app, you'd have state and handlers for form inputs
  // For this placeholder, we'll just display the data.

  return (
    <Container maxW="container.xl" py={10}>
      <VStack spacing={8} align="stretch">
        <Flex alignItems="center" mb={6}>
          <Heading as="h1" size="xl">
            User Profile
          </Heading>
          <Spacer />
          <Button leftIcon={<FiEdit2 />} colorScheme="brand" variant="outline">
            Edit Profile
          </Button>
        </Flex>

        <Box
          p={8}
          shadow="xl"
          borderWidth="1px"
          borderRadius="lg"
          bg={cardBg}
          borderColor={borderColor}
        >
          <HStack spacing={8} align="flex-start">
            <Avatar
              size="2xl"
              name={profileData.name}
              src={profileData.avatarUrl}
            />
            <VStack align="flex-start" spacing={3}>
              <Heading size="lg">{profileData.name}</Heading>
              <Text
                fontSize="md"
                color={useColorModeValue("gray.600", "gray.400")}
              >
                {profileData.title} at {profileData.company}
              </Text>
              <HStack spacing={1}>
                <Icon as={FiMapPin} w={4} h={4} />
                <Text
                  fontSize="sm"
                  color={useColorModeValue("gray.500", "gray.300")}
                >
                  {profileData.location}
                </Text>
              </HStack>
              <HStack spacing={1}>
                <Icon as={FiMail} w={4} h={4} />
                <Text
                  fontSize="sm"
                  color={useColorModeValue("gray.500", "gray.300")}
                >
                  {profileData.email}
                </Text>
              </HStack>
              <HStack spacing={1}>
                <Icon as={FiPhone} w={4} h={4} />
                <Text
                  fontSize="sm"
                  color={useColorModeValue("gray.500", "gray.300")}
                >
                  {profileData.phone}
                </Text>
              </HStack>
            </VStack>
          </HStack>
          <Text
            mt={6}
            fontSize="md"
            color={useColorModeValue("gray.700", "gray.200")}
          >
            {profileData.bio}
          </Text>
        </Box>

        <Tabs variant="soft-rounded" colorScheme="brand">
          <TabList>
            <Tab>Overview</Tab>
            <Tab>Edit Information</Tab>
            <Tab>Activity</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Box
                  p={5}
                  shadow="md"
                  borderWidth="1px"
                  borderRadius="md"
                  bg={cardBg}
                  borderColor={borderColor}
                >
                  <Heading size="md" mb={4}>
                    Skills
                  </Heading>
                  <HStack spacing={2} wrap="wrap">
                    {profileData.skills.map((skill) => (
                      <Badge
                        key={skill}
                        colorScheme="teal"
                        variant="solid"
                        p={2}
                        borderRadius="md"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </HStack>
                </Box>
                <Box
                  p={5}
                  shadow="md"
                  borderWidth="1px"
                  borderRadius="md"
                  bg={cardBg}
                  borderColor={borderColor}
                >
                  <Heading size="md" mb={4}>
                    Interests
                  </Heading>
                  <HStack spacing={2} wrap="wrap">
                    {profileData.interests.map((interest) => (
                      <Badge
                        key={interest}
                        colorScheme="purple"
                        variant="outline"
                        p={2}
                        borderRadius="md"
                      >
                        {interest}
                      </Badge>
                    ))}
                  </HStack>
                </Box>
              </VStack>
            </TabPanel>
            <TabPanel>
              <Box
                p={5}
                shadow="md"
                borderWidth="1px"
                borderRadius="md"
                bg={cardBg}
                borderColor={borderColor}
              >
                <Heading size="lg" mb={6}>
                  Edit Your Information
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <FormControl id="profile-name">
                    <FormLabel>Full Name</FormLabel>
                    <Input defaultValue={profileData.name} />
                  </FormControl>
                  <FormControl id="profile-email">
                    <FormLabel>Email Address</FormLabel>
                    <Input type="email" defaultValue={profileData.email} />
                  </FormControl>
                  <FormControl id="profile-phone">
                    <FormLabel>Phone</FormLabel>
                    <Input type="tel" defaultValue={profileData.phone} />
                  </FormControl>
                  <FormControl id="profile-location">
                    <FormLabel>Location</FormLabel>
                    <Input defaultValue={profileData.location} />
                  </FormControl>
                  <FormControl id="profile-title">
                    <FormLabel>Job Title</FormLabel>
                    <Input defaultValue={profileData.title} />
                  </FormControl>
                  <FormControl id="profile-company">
                    <FormLabel>Company</FormLabel>
                    <Input defaultValue={profileData.company} />
                  </FormControl>
                  <FormControl id="profile-bio" gridColumn={{ md: "span 2" }}>
                    <FormLabel>Bio</FormLabel>
                    <Textarea defaultValue={profileData.bio} rows={4} />
                  </FormControl>
                </SimpleGrid>
                <Button mt={8} colorScheme="brand" leftIcon={<FiSave />}>
                  Save Changes
                </Button>
              </Box>
            </TabPanel>
            <TabPanel>
              <Box
                p={5}
                shadow="md"
                borderWidth="1px"
                borderRadius="md"
                bg={cardBg}
                borderColor={borderColor}
              >
                <Heading size="md" mb={4}>
                  Recent Activity
                </Heading>
                <Text>
                  User activity feed would go here (e.g., posts, comments,
                  achievements).
                </Text>
                <VStack mt={4} spacing={3} align="stretch">
                  <HStack
                    p={3}
                    borderWidth="1px"
                    borderRadius="md"
                    borderColor={borderColor}
                  >
                    <Icon as={FiAward} color="yellow.400" />
                    <Text>Achieved "Top Contributor" badge.</Text>
                  </HStack>
                  <HStack
                    p={3}
                    borderWidth="1px"
                    borderRadius="md"
                    borderColor={borderColor}
                  >
                    <Icon as={FiBriefcase} color="blue.400" />
                    <Text>Updated profile information.</Text>
                  </HStack>
                </VStack>
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
};

export default UserProfile;
