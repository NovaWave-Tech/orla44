import {
  Box,
  Flex,
  HStack,
  Icon,
  IconButton,
  Text,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Badge,
} from '@chakra-ui/react'
import {
  FiBell,
  FiChevronDown,
  FiUser,
  FiSettings,
  FiLogOut,
} from 'react-icons/fi'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/alunos': 'Alunos',
  '/modalidades': 'Modalidades',
  '/turmas': 'Turmas',
  '/mensalidades': 'Mensalidades',
  '/presencas': 'Presenças',
  '/mensagens': 'Mensagens',
  '/notificacoes': 'Notificações',
  '/configuracoes': 'Configurações',
}

export default function TopBar() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const pageTitle = routeLabels[location.pathname] ?? 'Painel'
  const userName = user?.user_metadata?.nome ?? user?.email ?? 'Usuário'

  return (
    <Flex
      as="header"
      h="64px"
      px={{ base: 4, md: 6 }}
      bg="#0f1a0f"
      borderBottom="1px solid"
      borderColor="whiteAlpha.100"
      align="center"
      justify="space-between"
      position="sticky"
      top={0}
      zIndex={10}
    >
      {/* Left — Page title */}
      <Box>
        <Text fontSize="xs" color="whiteAlpha.500" fontWeight="500" textTransform="uppercase" letterSpacing="wider">
          {new Date().toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </Text>
        <Text fontSize="lg" fontWeight="700" color="white" lineHeight="1.2">
          {pageTitle}
        </Text>
      </Box>

      {/* Right — Actions */}
      <HStack spacing={2}>
        {/* Notifications */}
        <Box position="relative">
          <IconButton
            aria-label="Notificações"
            icon={<FiBell />}
            variant="ghost"
            rounded="xl"
            color="whiteAlpha.700"
            _hover={{ bg: 'whiteAlpha.100', color: 'white' }}
            onClick={() => navigate('/notificacoes')}
          />
          <Badge
            position="absolute"
            top="6px"
            right="6px"
            boxSize="8px"
            bg="brand.500"
            rounded="full"
            border="2px solid #0f1a0f"
            p={0}
          />
        </Box>

        {/* User Menu */}
        <Menu>
          <MenuButton
            as={Flex}
            align="center"
            gap={2}
            px={3}
            py={2}
            rounded="xl"
            cursor="pointer"
            transition="all 0.2s"
            _hover={{ bg: 'whiteAlpha.100' }}
          >
            <Avatar
              size="sm"
              name={userName}
              bg="brand.500"
              color="white"
              fontWeight="600"
            />
            <Box display={{ base: 'none', md: 'block' }} textAlign="left">
              <Text fontSize="sm" fontWeight="600" color="white" lineHeight="1.2">
                {userName.split(' ')[0]}
              </Text>
              <Text fontSize="xs" color="whiteAlpha.500" lineHeight="1.2">
                Administrador
              </Text>
            </Box>
            <Icon as={FiChevronDown} boxSize={4} color="whiteAlpha.500" display={{ base: 'none', md: 'block' }} />
          </MenuButton>

          <MenuList shadow="xl" border="1px solid" borderColor="gray.100" rounded="xl" py={2} minW="180px">
            <Box px={4} py={2} mb={1}>
              <Text fontSize="sm" fontWeight="600" color="gray.700">{userName.split(' ')[0]}</Text>
              <Text fontSize="xs" color="gray.400">{user?.email}</Text>
            </Box>
            <MenuDivider />
            <MenuItem
              icon={<Icon as={FiUser} />}
              fontSize="sm"
              color="gray.600"
              _hover={{ bg: 'gray.50' }}
              onClick={() => navigate('/configuracoes')}
            >
              Meu perfil
            </MenuItem>
            <MenuItem
              icon={<Icon as={FiSettings} />}
              fontSize="sm"
              color="gray.600"
              _hover={{ bg: 'gray.50' }}
              onClick={() => navigate('/configuracoes')}
            >
              Configurações
            </MenuItem>
            <MenuDivider />
            <MenuItem
              icon={<Icon as={FiLogOut} />}
              fontSize="sm"
              color="red.500"
              _hover={{ bg: 'red.50' }}
              onClick={signOut}
            >
              Sair
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>
    </Flex>
  )
}
