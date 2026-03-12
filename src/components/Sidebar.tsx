import {
  Box,
  Flex,
  VStack,
  Icon,
  Text,
  Image,
  Tooltip,
  Divider,
} from '@chakra-ui/react'
import {
  FiHome,
  FiUsers,
  FiGrid,
  FiLayers,
  FiDollarSign,
  FiCheckSquare,
  FiMessageSquare,
  FiBell,
  FiSettings,
  FiLogOut,
} from 'react-icons/fi'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface NavItem {
  label: string
  icon: React.ElementType
  path: string
}

const mainNav: NavItem[] = [
  { label: 'Dashboard', icon: FiHome, path: '/' },
  { label: 'Alunos', icon: FiUsers, path: '/alunos' },
  { label: 'Modalidades', icon: FiGrid, path: '/modalidades' },
  { label: 'Turmas', icon: FiLayers, path: '/turmas' },
  { label: 'Mensalidades', icon: FiDollarSign, path: '/mensalidades' },
  { label: 'Presenças', icon: FiCheckSquare, path: '/presencas' },
]

const secondaryNav: NavItem[] = [
  { label: 'Mensagens', icon: FiMessageSquare, path: '/mensagens' },
  { label: 'Notificações', icon: FiBell, path: '/notificacoes' },
  { label: 'Configurações', icon: FiSettings, path: '/configuracoes' },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const isActive = (path: string) => location.pathname === path

  const NavButton = ({ item }: { item: NavItem }) => {
    const active = isActive(item.path)
    return (
      <Tooltip label={item.label} placement="right" hasArrow>
        <Flex
          align="center"
          gap={3}
          px={4}
          py={2.5}
          rounded="xl"
          cursor="pointer"
          transition="all 0.2s"
          bg={active ? 'rgba(34,197,94,0.15)' : 'transparent'}
          color={active ? 'brand.400' : 'whiteAlpha.600'}
          fontWeight={active ? '600' : '400'}
          _hover={{
            bg: active ? 'rgba(34,197,94,0.15)' : 'whiteAlpha.100',
            color: active ? 'brand.400' : 'whiteAlpha.900',
          }}
          onClick={() => navigate(item.path)}
          role="group"
        >
          <Icon as={item.icon} boxSize={5} />
          <Text fontSize="sm" display={{ base: 'none', xl: 'block' }}>
            {item.label}
          </Text>
          {active && (
            <Box
              position="absolute"
              left={0}
              w="3px"
              h="28px"
              bg="brand.500"
              rounded="full"
            />
          )}
        </Flex>
      </Tooltip>
    )
  }

  return (
    <Flex
      as="aside"
      direction="column"
      w={{ base: '70px', xl: '240px' }}
      minH="100vh"
      bg="#0f1a0f"
      py={5}
      px={{ base: 2, xl: 4 }}
      position="fixed"
      left={0}
      top={0}
      zIndex={20}
      borderRight="1px solid"
      borderColor="whiteAlpha.100"
    >
      {/* Logo */}
      <Flex
        align="center"
        gap={3}
        px={2}
        mb={6}
        cursor="pointer"
        onClick={() => navigate('/')}
      >
        <Image
          src="/ArenaFitway.jpg"
          alt="ArenaFitway"
          w={{ base: '42px', xl: '42px' }}
          h={{ base: '42px', xl: '42px' }}
          rounded="xl"
          objectFit="cover"
          filter="drop-shadow(0 2px 8px rgba(34,197,94,0.4))"
        />
        <Box display={{ base: 'none', xl: 'block' }}>
          <Text
            fontSize="md"
            fontWeight="bold"
            color="white"
            lineHeight="1.2"
          >
            Arena<Text as="span" color="brand.400">Fitway</Text>
          </Text>
          <Text fontSize="xs" color="whiteAlpha.500" fontWeight="400">
            Gestão Esportiva
          </Text>
        </Box>
      </Flex>

      {/* Main Navigation */}
      <VStack spacing={1} align="stretch" flex={1} position="relative">
        {mainNav.map((item) => (
          <NavButton key={item.path} item={item} />
        ))}

        <Divider borderColor="whiteAlpha.100" my={3} />

        {secondaryNav.map((item) => (
          <NavButton key={item.path} item={item} />
        ))}
      </VStack>

      {/* Logout */}
      <Divider borderColor="whiteAlpha.100" mb={3} />
      <Flex
        align="center"
        gap={3}
        px={4}
        py={2.5}
        rounded="xl"
        cursor="pointer"
        transition="all 0.2s"
        color="whiteAlpha.500"
        _hover={{ bg: 'rgba(239,68,68,0.15)', color: 'red.400' }}
        onClick={signOut}
      >
        <Icon as={FiLogOut} boxSize={5} />
        <Text fontSize="sm" display={{ base: 'none', xl: 'block' }}>
          Sair
        </Text>
      </Flex>
    </Flex>
  )
}
