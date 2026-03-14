import { useState } from 'react'
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Icon,
  IconButton,
  Button,
  Badge,
  Skeleton,
  Tooltip,
  Divider,
} from '@chakra-ui/react'
import {
  FiBell,
  FiAlertTriangle,
  FiClock,
  FiInfo,
  FiRefreshCw,
  FiCheckCircle,
  FiDollarSign,
  FiUser,
  FiCalendar,
  FiChevronRight,
  FiCheck,
  FiX,
} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useNotificacoes, type TipoNotificacao } from '../../contexts/NotificacoesContext'
import AppLayout from '../../components/AppLayout'

const tipoConfig: Record<TipoNotificacao, {
  label: string
  iconBg: string
  iconColor: string
  badgeColor: string
  icon: React.ElementType
}> = {
  atraso: { label: 'Em Atraso', iconBg: 'red.50', iconColor: 'red.500', badgeColor: 'red', icon: FiAlertTriangle },
  vencimento: { label: 'A Vencer', iconBg: 'golden.50', iconColor: 'golden.500', badgeColor: 'yellow', icon: FiClock },
  info: { label: 'Informativo', iconBg: 'brand.50', iconColor: 'brand.500', badgeColor: 'green', icon: FiInfo },
}

type FiltroTipo = 'todas' | TipoNotificacao

export default function NotificacoesPage() {
  const navigate = useNavigate()
  const { notificacoes, loading, lidasIds, unreadCount, markAsRead, markAllAsRead, deleteNotificacao, reload } = useNotificacoes()
  const [filtro, setFiltro] = useState<FiltroTipo>('todas')

  const filtered = filtro === 'todas' ? notificacoes : notificacoes.filter(n => n.tipo === filtro)

  const counts = {
    todas: notificacoes.length,
    atraso: notificacoes.filter(n => n.tipo === 'atraso').length,
    vencimento: notificacoes.filter(n => n.tipo === 'vencimento').length,
    info: notificacoes.filter(n => n.tipo === 'info').length,
  }

  const filterButtons: { key: FiltroTipo; label: string; color: string }[] = [
    { key: 'todas', label: 'Todas', color: 'gray' },
    { key: 'atraso', label: 'Em Atraso', color: 'red' },
    { key: 'vencimento', label: 'A Vencer', color: 'yellow' },
    { key: 'info', label: 'Informativo', color: 'green' },
  ]

  return (
    <AppLayout>
      <Box p={{ base: 4, md: 6, lg: 8 }} maxW="900px" w="full" mx="auto">

        {/* ── Summary cards ─────────────────────────────────────────────── */}
        <Flex gap={4} mb={6} wrap="wrap">
          <Flex bg="white" rounded="2xl" px={5} py={4} align="center" gap={3}
            border="1px solid" borderColor="gray.100" flex="1" minW="140px">
            <Flex w={10} h={10} rounded="xl" bg="gray.100" align="center" justify="center">
              <Icon as={FiBell} boxSize={5} color="gray.500" />
            </Flex>
            <Box>
              <Text fontSize="2xl" fontWeight="bold" color="gray.800" lineHeight="1">{loading ? '–' : counts.todas}</Text>
              <Text fontSize="xs" color="gray.400" fontWeight="500">Total</Text>
            </Box>
          </Flex>

          <Flex bg="white" rounded="2xl" px={5} py={4} align="center" gap={3}
            border="1px solid" borderColor="gray.100" flex="1" minW="140px">
            <Flex w={10} h={10} rounded="xl" bg="brand.50" align="center" justify="center">
              <Icon as={FiBell} boxSize={5} color="brand.500" />
            </Flex>
            <Box>
              <Text fontSize="2xl" fontWeight="bold" color="gray.800" lineHeight="1">{loading ? '–' : unreadCount}</Text>
              <Text fontSize="xs" color="gray.400" fontWeight="500">Não lidas</Text>
            </Box>
          </Flex>

          <Flex bg="white" rounded="2xl" px={5} py={4} align="center" gap={3}
            border="1px solid" borderColor="gray.100" flex="1" minW="140px">
            <Flex w={10} h={10} rounded="xl" bg="red.50" align="center" justify="center">
              <Icon as={FiAlertTriangle} boxSize={5} color="red.500" />
            </Flex>
            <Box>
              <Text fontSize="2xl" fontWeight="bold" color="gray.800" lineHeight="1">{loading ? '–' : counts.atraso}</Text>
              <Text fontSize="xs" color="gray.400" fontWeight="500">Em Atraso</Text>
            </Box>
          </Flex>

          <Flex bg="white" rounded="2xl" px={5} py={4} align="center" gap={3}
            border="1px solid" borderColor="gray.100" flex="1" minW="140px">
            <Flex w={10} h={10} rounded="xl" bg="golden.50" align="center" justify="center">
              <Icon as={FiClock} boxSize={5} color="golden.500" />
            </Flex>
            <Box>
              <Text fontSize="2xl" fontWeight="bold" color="gray.800" lineHeight="1">{loading ? '–' : counts.vencimento}</Text>
              <Text fontSize="xs" color="gray.400" fontWeight="500">A Vencer</Text>
            </Box>
          </Flex>
        </Flex>

        {/* ── Main card ─────────────────────────────────────────────────── */}
        <Box bg="white" rounded="2xl" border="1px solid" borderColor="gray.100" overflow="hidden">

          {/* Toolbar */}
          <Flex px={5} py={4} borderBottom="1px solid" borderColor="gray.100"
            align="center" justify="space-between" gap={3} wrap="wrap">
            <HStack spacing={2} wrap="wrap">
              {filterButtons.map(f => (
                <Button
                  key={f.key}
                  size="sm"
                  rounded="xl"
                  variant={filtro === f.key ? 'solid' : 'ghost'}
                  colorScheme={filtro === f.key ? (f.key === 'todas' ? 'gray' : f.color) : 'gray'}
                  onClick={() => setFiltro(f.key)}
                  px={4}
                >
                  {f.label}
                  {counts[f.key] > 0 && (
                    <Badge ml={1.5} colorScheme={f.key === 'todas' ? 'gray' : f.color}
                      rounded="full" fontSize="xs" px={1.5}>
                      {counts[f.key]}
                    </Badge>
                  )}
                </Button>
              ))}
            </HStack>

            <HStack spacing={1}>
              {unreadCount > 0 && (
                <Button size="sm" variant="ghost" colorScheme="brand"
                  leftIcon={<FiCheck />} rounded="xl" onClick={markAllAsRead}>
                  Marcar todas
                </Button>
              )}
              <Tooltip label="Atualizar">
                <IconButton aria-label="Atualizar" icon={<FiRefreshCw />}
                  size="sm" variant="ghost" rounded="xl" color="gray.400"
                  isLoading={loading} onClick={reload} />
              </Tooltip>
            </HStack>
          </Flex>

          {/* List */}
          {loading ? (
            <VStack p={6} spacing={3}>
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} h="80px" w="full" rounded="xl" />)}
            </VStack>
          ) : filtered.length === 0 ? (
            <Flex direction="column" align="center" justify="center" py={16} px={8}>
              <Flex w={14} h={14} rounded="2xl" bg="gray.50" align="center" justify="center" mb={3}>
                <Icon as={FiCheckCircle} boxSize={6} color="gray.300" />
              </Flex>
              <Text fontSize="md" fontWeight="600" color="gray.400">
                {filtro === 'todas' ? 'Nenhuma notificação' : `Nenhuma notificação "${tipoConfig[filtro as TipoNotificacao]?.label}"`}
              </Text>
              <Text fontSize="sm" color="gray.300" mt={1}>Tudo em dia!</Text>
            </Flex>
          ) : (
            <VStack spacing={0} divider={<Divider borderColor="gray.50" />}>
              {filtered.map(n => {
                const config = tipoConfig[n.tipo]
                const isRead = lidasIds.has(n.id)
                return (
                  <Flex
                    key={n.id}
                    w="full" px={5} py={4} align="center" gap={4}
                    bg={isRead ? 'transparent' : 'brand.50'}
                    _hover={{ bg: isRead ? 'gray.50' : 'brand.50' }}
                    transition="background 0.15s"
                    position="relative"
                  >
                    {/* Unread dot */}
                    {!isRead && (
                      <Box position="absolute" left="14px" top="50%"
                        transform="translateY(-50%)" w="8px" h="8px"
                        rounded="full" bg="brand.500" flexShrink={0} />
                    )}

                    {/* Type icon */}
                    <Flex w={10} h={10} rounded="xl" bg={config.iconBg}
                      align="center" justify="center" flexShrink={0}
                      ml={isRead ? 0 : 2}>
                      <Icon as={config.icon} boxSize={4.5} color={config.iconColor} />
                    </Flex>

                    {/* Content */}
                    <Box flex={1} minW={0}>
                      <HStack spacing={2} mb={0.5} wrap="wrap">
                        <Text fontSize="sm" fontWeight={isRead ? '500' : '700'}
                          color={isRead ? 'gray.600' : 'gray.800'}>
                          {n.titulo}
                        </Text>
                        <Badge colorScheme={config.badgeColor} rounded="full" px={2} fontSize="xs" fontWeight="600">
                          {config.label}
                        </Badge>
                        {!isRead && (
                          <Badge colorScheme="brand" rounded="full" px={2} fontSize="xs" variant="subtle">
                            Nova
                          </Badge>
                        )}
                      </HStack>

                      <HStack spacing={1.5} mb={0.5}>
                        <Icon as={FiUser} boxSize={3} color="gray.400" />
                        <Text fontSize="sm" fontWeight="600" color="gray.600" noOfLines={1}>{n.alunoNome}</Text>
                      </HStack>

                      <HStack spacing={3} wrap="wrap">
                        <HStack spacing={1}>
                          <Icon as={FiCalendar} boxSize={3} color="gray.400" />
                          <Text fontSize="xs" color="gray.400">{n.descricao}</Text>
                        </HStack>
                        {n.valor !== undefined && (
                          <HStack spacing={1}>
                            <Icon as={FiDollarSign} boxSize={3} color="gray.400" />
                            <Text fontSize="xs" color="gray.500" fontWeight="600">
                              {n.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </Text>
                          </HStack>
                        )}
                      </HStack>
                    </Box>

                    {/* Right */}
                    <Flex direction="column" align="flex-end" gap={1.5} flexShrink={0}>
                      <Badge colorScheme={config.badgeColor} variant="subtle"
                        rounded="full" px={2.5} py={0.5} fontSize="xs" fontWeight="700">
                        {n.detalhe}
                      </Badge>

                      <HStack spacing={1}>
                        {!isRead && (
                          <Tooltip label="Marcar como lida">
                            <IconButton aria-label="Marcar como lida" icon={<FiCheck />}
                              size="xs" variant="ghost" colorScheme="green" rounded="lg"
                              onClick={() => markAsRead(n.id)} />
                          </Tooltip>
                        )}
                        <Tooltip label="Excluir notificação">
                          <IconButton aria-label="Excluir" icon={<FiX />}
                            size="xs" variant="ghost" colorScheme="red" rounded="lg"
                            onClick={() => deleteNotificacao(n.id)} />
                        </Tooltip>
                        <Button size="xs" variant="ghost" colorScheme="brand"
                          rightIcon={<FiChevronRight />} rounded="lg"
                          onClick={() => navigate('/mensalidades')}>
                          Ver
                        </Button>
                      </HStack>
                    </Flex>
                  </Flex>
                )
              })}
            </VStack>
          )}

          {/* Footer */}
          {!loading && filtered.length > 0 && (
            <Flex px={5} py={3} borderTop="1px solid" borderColor="gray.50"
              justify="space-between" align="center">
              <Text fontSize="xs" color="gray.400">
                Exibindo {filtered.length} de {notificacoes.length} notificaç{notificacoes.length !== 1 ? 'ões' : 'ão'}
              </Text>
              {counts.atraso > 0 && (
                <HStack spacing={1}>
                  <Icon as={FiAlertTriangle} boxSize={3} color="red.400" />
                  <Text fontSize="xs" color="red.400" fontWeight="600">{counts.atraso} em atraso</Text>
                </HStack>
              )}
            </Flex>
          )}
        </Box>
      </Box>
    </AppLayout>
  )
}
