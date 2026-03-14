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
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverFooter,
  VStack,
  Divider,
  Button,
  Tooltip,
  Skeleton,
} from '@chakra-ui/react'
import {
  FiBell,
  FiChevronDown,
  FiUser,
  FiSettings,
  FiLogOut,
  FiAlertTriangle,
  FiClock,
  FiInfo,
  FiCheck,
  FiX,
  FiCheckCircle,
  FiChevronRight,
} from 'react-icons/fi'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useNotificacoes, type TipoNotificacao, type Notificacao } from '../contexts/NotificacoesContext'

const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/alunos': 'Alunos',
  '/modalidades': 'Modalidades',
  '/turmas': 'Turmas',
  '/mensalidades': 'Mensalidades',
  '/gastos': 'Gastos',
  '/presencas': 'Presenças',
  '/mensagens': 'Mensagens',
  '/notificacoes': 'Notificações',
  '/configuracoes': 'Configurações',
}

const tipoConfig: Record<TipoNotificacao, {
  iconBg: string
  iconColor: string
  badgeColor: string
  icon: React.ElementType
}> = {
  atraso: { iconBg: 'red.50', iconColor: 'red.500', badgeColor: 'red', icon: FiAlertTriangle },
  vencimento: { iconBg: 'orange.50', iconColor: 'orange.400', badgeColor: 'orange', icon: FiClock },
  info: { iconBg: 'blue.50', iconColor: 'blue.400', badgeColor: 'blue', icon: FiInfo },
}

function NotifItem({
  n,
  isRead,
  onRead,
  onDelete,
}: {
  n: Notificacao
  isRead: boolean
  onRead: () => void
  onDelete: () => void
}) {
  const cfg = tipoConfig[n.tipo]
  return (
    <Flex
      w="full"
      px={3}
      py={3}
      gap={3}
      align="flex-start"
      bg={isRead ? 'transparent' : 'brand.50'}
      _hover={{ bg: isRead ? 'gray.50' : 'brand.50' }}
      transition="background 0.15s"
      rounded="xl"
      position="relative"
    >
      {/* Unread dot */}
      {!isRead && (
        <Box
          position="absolute"
          top="14px"
          left="6px"
          w="6px"
          h="6px"
          rounded="full"
          bg="brand.500"
          flexShrink={0}
        />
      )}

      {/* Type icon */}
      <Flex
        w={8}
        h={8}
        rounded="lg"
        bg={cfg.iconBg}
        align="center"
        justify="center"
        flexShrink={0}
        ml={isRead ? 0 : 1}
      >
        <Icon as={cfg.icon} boxSize={3.5} color={cfg.iconColor} />
      </Flex>

      {/* Content */}
      <Box flex={1} minW={0}>
        <Text
          fontSize="xs"
          fontWeight={isRead ? '500' : '700'}
          color={isRead ? 'gray.500' : 'gray.800'}
          lineHeight="1.3"
          noOfLines={1}
        >
          {n.alunoNome}
        </Text>
        <Text fontSize="xs" color="gray.400" noOfLines={1} mt={0.5}>
          {n.descricao}
        </Text>
        <Badge
          mt={1}
          colorScheme={cfg.badgeColor}
          variant="subtle"
          rounded="full"
          px={1.5}
          fontSize="10px"
          fontWeight="700"
        >
          {n.detalhe}
        </Badge>
      </Box>

      {/* Actions */}
      <Flex gap={1} flexShrink={0} mt={0.5}>
        {!isRead && (
          <Tooltip label="Marcar como lida" hasArrow>
            <IconButton
              aria-label="Marcar como lida"
              icon={<FiCheck />}
              size="xs"
              variant="ghost"
              colorScheme="green"
              rounded="lg"
              onClick={(e) => { e.stopPropagation(); onRead() }}
            />
          </Tooltip>
        )}
        <Tooltip label="Excluir" hasArrow>
          <IconButton
            aria-label="Excluir notificação"
            icon={<FiX />}
            size="xs"
            variant="ghost"
            colorScheme="red"
            rounded="lg"
            onClick={(e) => { e.stopPropagation(); onDelete() }}
          />
        </Tooltip>
      </Flex>
    </Flex>
  )
}

export default function TopBar() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { notificacoes, loading, lidasIds, unreadCount, markAsRead, markAllAsRead, deleteNotificacao } = useNotificacoes()

  const pageTitle = routeLabels[location.pathname] ?? 'Painel'
  const userName = user?.user_metadata?.nome ?? user?.email ?? 'Usuário'
  const popupNotifs = notificacoes.filter(n => !lidasIds.has(n.id))

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

        {/* Notifications Popover */}
        <Popover placement="bottom-end" isLazy closeOnBlur>
          <PopoverTrigger>
            <Box position="relative">
              <IconButton
                aria-label="Notificações"
                icon={<FiBell />}
                variant="ghost"
                rounded="xl"
                color="whiteAlpha.700"
                _hover={{ bg: 'whiteAlpha.100', color: 'white' }}
              />
              {unreadCount > 0 && (
                <Badge
                  position="absolute"
                  top="4px"
                  right="4px"
                  minW="16px"
                  h="16px"
                  bg="brand.500"
                  color="white"
                  rounded="full"
                  border="2px solid #0f1a0f"
                  fontSize="9px"
                  fontWeight="800"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  px={unreadCount > 9 ? 1 : 0}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Box>
          </PopoverTrigger>

          <PopoverContent
            w="360px"
            maxW="calc(100vw - 32px)"
            rounded="2xl"
            shadow="2xl"
            border="1px solid"
            borderColor="gray.100"
            bg="white"
            _focus={{ outline: 'none' }}
          >
            {/* Header */}
            <PopoverHeader
              px={4}
              py={3}
              borderBottom="1px solid"
              borderColor="gray.100"
              rounded="none"
            >
              <Flex align="center" justify="space-between">
                <HStack spacing={2}>
                  <Text fontSize="sm" fontWeight="700" color="gray.800">
                    Notificações
                  </Text>
                  {unreadCount > 0 && (
                    <Badge colorScheme="brand" rounded="full" px={1.5} fontSize="xs">
                      {unreadCount} nova{unreadCount !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </HStack>
                {unreadCount > 0 && (
                  <Button
                    size="xs"
                    variant="ghost"
                    colorScheme="brand"
                    leftIcon={<FiCheck />}
                    rounded="lg"
                    onClick={markAllAsRead}
                  >
                    Marcar todas
                  </Button>
                )}
              </Flex>
            </PopoverHeader>

            {/* Body */}
            <PopoverBody px={2} py={2} maxH="380px" overflowY="auto">
              {loading ? (
                <VStack p={2} spacing={2}>
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} h="64px" w="full" rounded="xl" />
                  ))}
                </VStack>
              ) : popupNotifs.length === 0 ? (
                <Flex direction="column" align="center" py={8} gap={2}>
                  <Flex w={10} h={10} rounded="xl" bg="gray.50" align="center" justify="center">
                    <Icon as={FiCheckCircle} boxSize={5} color="gray.300" />
                  </Flex>
                  <Text fontSize="sm" color="gray.400" fontWeight="600">
                    Tudo em dia!
                  </Text>
                  <Text fontSize="xs" color="gray.300">
                    Nenhuma notificação
                  </Text>
                </Flex>
              ) : (
                <VStack spacing={0.5}>
                  {popupNotifs.map(n => (
                    <NotifItem
                      key={n.id}
                      n={n}
                      isRead={lidasIds.has(n.id)}
                      onRead={() => markAsRead(n.id)}
                      onDelete={() => deleteNotificacao(n.id)}
                    />
                  ))}
                </VStack>
              )}
            </PopoverBody>

            {/* Footer */}
            <PopoverFooter
              px={4}
              py={2.5}
              borderTop="1px solid"
              borderColor="gray.100"
              rounded="none"
            >
              <Button
                w="full"
                size="sm"
                variant="ghost"
                colorScheme="brand"
                rightIcon={<FiChevronRight />}
                rounded="xl"
                onClick={() => navigate('/notificacoes')}
                fontWeight="600"
              >
                Ver todas as notificações
              </Button>
            </PopoverFooter>
          </PopoverContent>
        </Popover>

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
            <Box textAlign="left">
              <Text fontSize="sm" fontWeight="600" color="white" lineHeight="1.2">
                {userName.split(' ')[0]}
              </Text>
            </Box>
            <Icon as={FiChevronDown} boxSize={4} color="whiteAlpha.500" />
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
