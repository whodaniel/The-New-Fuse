import React, { ReactNode } from "react";
import {
  Box,
  Flex,
  useColorModeValue,
  Drawer,
  DrawerContent,
  useDisclosure,
  Text,
  IconButton,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  VStack,
  Icon,
} from "@chakra-ui/react";
import { Outlet, Link as RouterLink } from "react-router-dom";
import {
  FiHome,
  FiSettings,
  FiUser,
  FiLogOut,
  FiMenu,
  FiBell,
  FiChevronDown,
} from "react-icons/fi"; // Example icons
import { useAuthContext } from "../contexts/AuthContext";

interface NavItemProps {
  icon: React.ElementType;
  children: ReactNode;
  to: string;
}

const NavItem: React.FC<NavItemProps> = ({ icon, children, to, ...rest }) => {
  return (
    <RouterLink to={to} style={{ textDecoration: "none" }}>
      <Flex
        align="center"
        p="4"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        _hover={{
          bg: "brand.400",
          color: "white",
        }}
        {...rest}
      >
        {icon && (
          <Icon
            mr="4"
            fontSize="16"
            _groupHover={{
              color: "white",
            }}
            as={icon}
          />
        )}
        {children}
      </Flex>
    </RouterLink>
  );
};

interface SidebarProps {
  onClose: () => void;
  display?: { base: string; md: string };
}

const SidebarContent: React.FC<SidebarProps> = ({ onClose, ...rest }) => {
  const LinkItems = [
    { name: "Dashboard", icon: FiHome, to: "/dashboard" },
    { name: "Profile", icon: FiUser, to: "/profile" },
    { name: "Settings", icon: FiSettings, to: "/settings" },
  ];

  return (
    <Box
      bg={useColorModeValue("white", "gray.900")}
      borderRight="1px"
      borderRightColor={useColorModeValue("gray.200", "gray.700")}
      w={{ base: "full", md: 60 }}
      pos="fixed"
      h="full"
      {...rest}
    >
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <Text
          fontSize="2xl"
          fontFamily="monospace"
          fontWeight="bold"
          color="brand.500"
        >
          Logo
        </Text>
        {/* <CloseButton display={{ base: 'flex', md: 'none' }} onClick={onClose} /> */}
      </Flex>
      {LinkItems.map((link) => (
        <NavItem key={link.name} icon={link.icon} to={link.to}>
          {link.name}
        </NavItem>
      ))}
    </Box>
  );
};

interface MobileProps {
  onOpen: () => void;
}
const MobileNav: React.FC<MobileProps> = ({ onOpen, ...rest }) => {
  const { user, logout } = useAuthContext();
  return (
    <Flex
      ml={{ base: 0, md: 60 }}
      px={{ base: 4, md: 4 }}
      height="20"
      alignItems="center"
      bg={useColorModeValue("white", "gray.900")}
      borderBottomWidth="1px"
      borderBottomColor={useColorModeValue("gray.200", "gray.700")}
      justifyContent={{ base: "space-between", md: "flex-end" }}
      {...rest}
    >
      <IconButton
        display={{ base: "flex", md: "none" }}
        onClick={onOpen}
        variant="outline"
        aria-label="open menu"
        icon={<FiMenu />}
      />

      <Text
        display={{ base: "flex", md: "none" }}
        fontSize="2xl"
        fontFamily="monospace"
        fontWeight="bold"
      >
        Logo
      </Text>

      <HStack spacing={{ base: "0", md: "6" }}>
        <IconButton
          size="lg"
          variant="ghost"
          aria-label="open menu"
          icon={<FiBell />}
        />
        <Flex alignItems={"center"}>
          <Menu>
            <MenuButton
              py={2}
              transition="all 0.3s"
              _focus={{ boxShadow: "none" }}
            >
              <HStack>
                <Avatar
                  size={"sm"}
                  name={user?.name || "User"}
                  // src={user?.avatarUrl} // If user object has avatar
                />
                <VStack
                  display={{ base: "none", md: "flex" }}
                  alignItems="flex-start"
                  spacing="1px"
                  ml="2"
                >
                  <Text fontSize="sm">{user?.name || "User Name"}</Text>
                  <Text fontSize="xs" color="gray.600">
                    {/* Role or other info */}
                    Admin
                  </Text>
                </VStack>
                <Box display={{ base: "none", md: "flex" }}>
                  <FiChevronDown />
                </Box>
              </HStack>
            </MenuButton>
            <MenuList
              bg={useColorModeValue("white", "gray.900")}
              borderColor={useColorModeValue("gray.200", "gray.700")}
            >
              <MenuItem as={RouterLink} to="/profile">
                Profile
              </MenuItem>
              <MenuItem as={RouterLink} to="/settings">
                Settings
              </MenuItem>
              {/* <MenuDivider /> */}
              <MenuItem onClick={logout}>Sign out</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </HStack>
    </Flex>
  );
};

const MainLayout: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <Box minH="100vh" bg={useColorModeValue("gray.100", "gray.900")}>
      <SidebarContent
        onClose={() => onClose}
        display={{ base: "none", md: "block" }}
      />
      <Drawer
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full"
      >
        <DrawerContent>
          <SidebarContent onClose={onClose} />
        </DrawerContent>
      </Drawer>
      {/* mobilenav */}
      <MobileNav onOpen={onOpen} />
      <Box ml={{ base: 0, md: 60 }} p="4">
        {/* Content */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;
