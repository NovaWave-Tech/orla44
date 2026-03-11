import { useEffect, useState } from 'react'
import {
  Box,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Icon,
  SimpleGrid,
  Avatar,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Skeleton,
} from '@chakra-ui/react'
import {
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiAlertTriangle,
  FiLayers,
  FiTrendingUp,
  FiClock,
  FiCheckCircle,
} from 'react-icons/fi'
import { supabase } from '../../lib/supabase'
import AppLayout from '../../components/AppLayout'

interface DashboardStats {
  totalAlunos: number
  alunosAtivos: number
  alunosInadimplentes: number
  totalTurmas: number
  mensalidadesMes: number
  mensalidadesPendentes: number
}

interface ProximoVencimento {
  aluno: string
  vencimento: string
  valor: number
  situacao: number
}

interface TreinoHoje {
  turma: string
  horario: string
  modalidade: string
  alunos: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalAlunos: 0,
    alunosAtivos: 0,
    alunosInadimplentes: 0,
    totalTurmas: 0,
    mensalidadesMes: 0,
    mensalidadesPendentes: 0,
  })
  const [loading, setLoading] = useState(true)
  const [proximosVencimentos, setProximosVencimentos] = useState<ProximoVencimento[]>([])
  const [treinosHoje, setTreinosHoje] = useState<TreinoHoje[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Total alunos
      const { count: totalAlunos } = await supabase
        .from('aluno')
        .select('*', { count: 'exact', head: true })

      // Alunos ativos
      const { count: alunosAtivos } = await supabase
        .from('aluno')
        .select('*', { count: 'exact', head: true })
        .eq('situacao', 1)

      // Total turmas ativas
      const { count: totalTurmas } = await supabase
        .from('turma')
        .select('*', { count: 'exact', head: true })
        .eq('situacao', 1)

      // Mensalidades pendentes
      const { count: mensalidadesPendentes } = await supabase
        .from('mensalidade')
        .select('*', { count: 'exact', head: true })
        .in('situacao', [0, 2])

      // Mensalidades do mês
      const mesAtual = new Date().toISOString().slice(0, 7) // YYYY-MM
      const { count: mensalidadesMes } = await supabase
        .from('mensalidade')
        .select('*', { count: 'exact', head: true })
        .like('mes_referencia', `%${mesAtual}%`)

      // Inadimplentes (alunos com mensalidades vencidas)
      const { data: inadimplentesData } = await supabase
        .from('mensalidade')
        .select('aluno_id')
        .eq('situacao', 2)
      const alunosInadimplentes = new Set(inadimplentesData?.map((m) => m.aluno_id)).size

      setStats({
        totalAlunos: totalAlunos ?? 0,
        alunosAtivos: alunosAtivos ?? 0,
        alunosInadimplentes,
        totalTurmas: totalTurmas ?? 0,
        mensalidadesMes: mensalidadesMes ?? 0,
        mensalidadesPendentes: mensalidadesPendentes ?? 0,
      })

      // Próximos vencimentos
      const { data: vencimentos } = await supabase
        .from('mensalidade')
        .select('valor, data_vencimento, situacao, aluno:aluno_id(nome)')
        .in('situacao', [0, 2])
        .order('data_vencimento', { ascending: true })
        .limit(5)

      if (vencimentos) {
        setProximosVencimentos(
          vencimentos.map((v: any) => ({
            aluno: v.aluno?.nome ?? 'N/A',
            vencimento: v.data_vencimento,
            valor: v.valor,
            situacao: v.situacao,
          }))
        )
      }

      // Treinos de hoje
      const hoje = new Date()
      const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
      const diaHoje = diasSemana[hoje.getDay()]

      const { data: turmasHoje } = await supabase
        .from('turma')
        .select('nome, horario, dias_semana, modalidade:modalidade_id(nome)')
        .eq('situacao', 1)
        .ilike('dias_semana', `%${diaHoje}%`)

      if (turmasHoje) {
        const treinosComAlunos = await Promise.all(
          turmasHoje.map(async (t: any) => {
            const { count } = await supabase
              .from('aluno')
              .select('*', { count: 'exact', head: true })
              .eq('turma_id', t.idturma)
              .eq('situacao', 1)
            return {
              turma: t.nome,
              horario: t.horario?.slice(0, 5) ?? '',
              modalidade: t.modalidade?.nome ?? '',
              alunos: count ?? 0,
            }
          })
        )
        setTreinosHoje(treinosComAlunos)
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const statCards = [
    {
      label: 'Total de Alunos',
      value: stats.totalAlunos,
      icon: FiUsers,
      color: 'brand.500',
      bg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
      iconBg: 'brand.50',
    },
    {
      label: 'Alunos Ativos',
      value: stats.alunosAtivos,
      icon: FiCheckCircle,
      color: 'palm.500',
      bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      iconBg: 'palm.50',
    },
    {
      label: 'Inadimplentes',
      value: stats.alunosInadimplentes,
      icon: FiAlertTriangle,
      color: 'sunset.500',
      bg: 'linear-gradient(135deg, #fef3f2 0%, #fde5e3 100%)',
      iconBg: 'sunset.50',
    },
    {
      label: 'Turmas Ativas',
      value: stats.totalTurmas,
      icon: FiLayers,
      color: 'purple.500',
      bg: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
      iconBg: 'purple.50',
    },
    {
      label: 'Mensalidades do Mês',
      value: stats.mensalidadesMes,
      icon: FiTrendingUp,
      color: 'golden.600',
      bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
      iconBg: 'golden.50',
    },
    {
      label: 'Pendentes',
      value: stats.mensalidadesPendentes,
      icon: FiDollarSign,
      color: 'red.500',
      bg: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
      iconBg: 'red.50',
    },
  ]

  return (
    <AppLayout>
      <Box p={{ base: 4, md: 6, lg: 8 }} maxW="1400px" w="full" mx="auto">
        {/* Stats Grid */}
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={5} mb={8}>
          {statCards.map((card) => (
            <Box
              key={card.label}
              bg={card.bg}
              rounded="2xl"
              p={5}
              border="1px solid"
              borderColor="blackAlpha.50"
              transition="all 0.2s"
              _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
            >
              <Flex justify="space-between" align="start">
                <Box>
                  <Text fontSize="xs" fontWeight="600" color="gray.500" textTransform="uppercase" letterSpacing="wider">
                    {card.label}
                  </Text>
                  <Skeleton isLoaded={!loading} mt={2}>
                    <Text fontSize="3xl" fontWeight="bold" color="gray.800">
                      {card.value}
                    </Text>
                  </Skeleton>
                </Box>
                <Flex
                  w={10}
                  h={10}
                  rounded="xl"
                  bg="white"
                  align="center"
                  justify="center"
                  shadow="sm"
                >
                  <Icon as={card.icon} boxSize={5} color={card.color} />
                </Flex>
              </Flex>
            </Box>
          ))}
        </SimpleGrid>

        {/* Bottom Section */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {/* Próximos Vencimentos */}
          <Box bg="white" rounded="2xl" shadow="sm" border="1px solid" borderColor="gray.100" overflow="hidden">
            <Flex
              px={6}
              py={4}
              borderBottom="1px solid"
              borderColor="gray.100"
              align="center"
              justify="space-between"
            >
              <HStack spacing={2}>
                <Icon as={FiDollarSign} color="brand.500" />
                <Heading size="sm" color="gray.700">
                  Próximos Vencimentos
                </Heading>
              </HStack>
              <Badge colorScheme="orange" rounded="full" px={2} fontSize="xs">
                {proximosVencimentos.length}
              </Badge>
            </Flex>

            {loading ? (
              <VStack p={6} spacing={3}>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} h="40px" w="full" rounded="lg" />
                ))}
              </VStack>
            ) : proximosVencimentos.length === 0 ? (
              <Flex p={8} justify="center" align="center" direction="column">
                <Icon as={FiCheckCircle} boxSize={10} color="palm.400" mb={3} />
                <Text color="gray.400" fontSize="sm">
                  Nenhum vencimento pendente
                </Text>
              </Flex>
            ) : (
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th color="gray.400" fontSize="xs">Aluno</Th>
                    <Th color="gray.400" fontSize="xs">Vencimento</Th>
                    <Th color="gray.400" fontSize="xs" isNumeric>Valor</Th>
                    <Th color="gray.400" fontSize="xs">Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {proximosVencimentos.map((v, i) => (
                    <Tr key={i} _hover={{ bg: 'gray.50' }}>
                      <Td>
                        <HStack spacing={2}>
                          <Avatar size="xs" name={v.aluno} bg="brand.100" color="brand.700" />
                          <Text fontSize="sm" fontWeight="500" color="gray.700">
                            {v.aluno}
                          </Text>
                        </HStack>
                      </Td>
                      <Td>
                        <Text fontSize="sm" color="gray.600">
                          {formatDate(v.vencimento)}
                        </Text>
                      </Td>
                      <Td isNumeric>
                        <Text fontSize="sm" fontWeight="600" color="gray.700">
                          {formatCurrency(v.valor)}
                        </Text>
                      </Td>
                      <Td>
                        <Badge
                          colorScheme={v.situacao === 2 ? 'red' : 'yellow'}
                          rounded="full"
                          px={2}
                          fontSize="xs"
                        >
                          {v.situacao === 2 ? 'Vencido' : 'Pendente'}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </Box>

          {/* Treinos de Hoje */}
          <Box bg="white" rounded="2xl" shadow="sm" border="1px solid" borderColor="gray.100" overflow="hidden">
            <Flex
              px={6}
              py={4}
              borderBottom="1px solid"
              borderColor="gray.100"
              align="center"
              justify="space-between"
            >
              <HStack spacing={2}>
                <Icon as={FiCalendar} color="brand.500" />
                <Heading size="sm" color="gray.700">
                  Treinos de Hoje
                </Heading>
              </HStack>
              <Badge colorScheme="green" rounded="full" px={2} fontSize="xs">
                {treinosHoje.length}
              </Badge>
            </Flex>

            {loading ? (
              <VStack p={6} spacing={3}>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} h="60px" w="full" rounded="lg" />
                ))}
              </VStack>
            ) : treinosHoje.length === 0 ? (
              <Flex p={8} justify="center" align="center" direction="column">
                <Icon as={FiCalendar} boxSize={10} color="gray.300" mb={3} />
                <Text color="gray.400" fontSize="sm">
                  Nenhum treino agendado para hoje
                </Text>
              </Flex>
            ) : (
              <VStack spacing={0} divider={<Box borderBottom="1px solid" borderColor="gray.50" />}>
                {treinosHoje.map((t, i) => (
                  <Flex
                    key={i}
                    w="full"
                    px={6}
                    py={4}
                    align="center"
                    justify="space-between"
                    _hover={{ bg: 'gray.50' }}
                    transition="background 0.15s"
                  >
                    <HStack spacing={3}>
                      <Flex
                        w={10}
                        h={10}
                        rounded="xl"
                        bg="brand.50"
                        align="center"
                        justify="center"
                      >
                        <Icon as={FiClock} color="brand.500" />
                      </Flex>
                      <Box>
                        <Text fontSize="sm" fontWeight="600" color="gray.700">
                          {t.turma}
                        </Text>
                        <Text fontSize="xs" color="gray.400">
                          {t.modalidade}
                        </Text>
                      </Box>
                    </HStack>
                    <VStack spacing={0} align="end">
                      <Text fontSize="sm" fontWeight="600" color="brand.600">
                        {t.horario}
                      </Text>
                      <Text fontSize="xs" color="gray.400">
                        {t.alunos} aluno{t.alunos !== 1 ? 's' : ''}
                      </Text>
                    </VStack>
                  </Flex>
                ))}
              </VStack>
            )}
          </Box>
        </SimpleGrid>
      </Box>
    </AppLayout>
  )
}
