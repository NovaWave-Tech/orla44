import { useEffect, useState, useCallback } from 'react'
import {
  Box,
  Flex,
  Text,
  HStack,
  VStack,
  Icon,
  IconButton,
  Input,
  Select,
  Button,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Skeleton,
  useDisclosure,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Tooltip,
  Tag,
  Avatar,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react'
import {
  FiDollarSign,
  FiSearch,
  FiRefreshCw,
  FiClock,
  FiCheckCircle,
  FiAlertTriangle,
  FiCalendar,
  FiCheck,
  FiZap,
  FiBell,
} from 'react-icons/fi'
import { useRef } from 'react'
import { supabase } from '../../lib/supabase'
import AppLayout from '../../components/AppLayout'

interface MensalidadeRow {
  idmensalidade: number
  aluno_id: number
  valor: number
  mes_referencia: string
  data_vencimento: string
  data_pagamento: string | null
  situacao: number
  criado_em: string
  aluno?: { nome: string; telefone: string }
}

export default function MensalidadesPage() {
  const toast = useToast()
  const [mensalidades, setMensalidades] = useState<MensalidadeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroSituacao, setFiltroSituacao] = useState<string>('')
  const [filtroMes, setFiltroMes] = useState<string>('')

  // Confirm payment dialog
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure()
  const [confirmingMensalidade, setConfirmingMensalidade] = useState<MensalidadeRow | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [alunosSemMensalidade, setAlunosSemMensalidade] = useState(0)
  const cancelRef = useRef<HTMLButtonElement>(null)

  // Calcula mês de referência atual
  const getMesAtualRef = () => {
    const now = new Date()
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    return `${meses[now.getMonth()]}/${now.getFullYear()}`
  }

  const checkAlunosSemMensalidade = useCallback(async () => {
    try {
      const mesRef = getMesAtualRef()
      const [{ data: alunos }, { data: existentes }] = await Promise.all([
        supabase.from('aluno').select('idaluno').eq('situacao', 1),
        supabase.from('mensalidade').select('aluno_id').eq('mes_referencia', mesRef),
      ])
      const comMens = new Set((existentes ?? []).map((e: any) => e.aluno_id))
      const semMens = (alunos ?? []).filter((a: any) => !comMens.has(a.idaluno)).length
      setAlunosSemMensalidade(semMens)
    } catch {
      // silencioso
    }
  }, [])

  useEffect(() => {
    loadMensalidades()
    checkAlunosSemMensalidade()
  }, [checkAlunosSemMensalidade])

  // Auto-update overdue mensalidades
  const updateOverdue = useCallback(async (data: MensalidadeRow[]) => {
    const today = new Date().toISOString().slice(0, 10)
    const overdue = data.filter(
      (m) => m.situacao === 0 && m.data_vencimento < today
    )

    if (overdue.length > 0) {
      const ids = overdue.map((m) => m.idmensalidade)
      await supabase
        .from('mensalidade')
        .update({ situacao: 2 })
        .in('idmensalidade', ids)

      // Update locally
      return data.map((m) =>
        ids.includes(m.idmensalidade) ? { ...m, situacao: 2 } : m
      )
    }
    return data
  }, [])

  const loadMensalidades = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('mensalidade')
        .select('*, aluno:aluno_id(nome, telefone)')
        .order('data_vencimento', { ascending: false })

      if (error) throw error

      const updated = await updateOverdue(data ?? [])
      setMensalidades(updated)
    } catch (err: any) {
      toast({ title: 'Erro ao carregar mensalidades', description: err.message, status: 'error', duration: 4000 })
    } finally {
      setLoading(false)
    }
  }, [toast, updateOverdue])

  const handleConfirmPayment = (m: MensalidadeRow) => {
    setConfirmingMensalidade(m)
    onConfirmOpen()
  }

  const gerarMensalidadesMes = async () => {
    setGenerating(true)
    try {
      const now = new Date()
      const mesRef = getMesAtualRef()
      const ano = now.getFullYear()
      const mes = now.getMonth() + 1 // 1-based

      // Busca todos os alunos ativos com valor_mensalidade
      const { data: alunos, error: alunosError } = await supabase
        .from('aluno')
        .select('idaluno, nome, dia_vencimento, valor_mensalidade')
        .eq('situacao', 1)

      if (alunosError) throw alunosError
      if (!alunos || alunos.length === 0) {
        toast({ title: 'Nenhum aluno ativo encontrado', status: 'warning', duration: 3000 })
        return
      }

      // Busca mensalidades já existentes neste mês
      const { data: existentes } = await supabase
        .from('mensalidade')
        .select('aluno_id')
        .eq('mes_referencia', mesRef)

      const alunosComMens = new Set((existentes ?? []).map((e: any) => e.aluno_id))

      // Filtra apenas quem ainda não tem
      const novos = alunos.filter((a: any) => !alunosComMens.has(a.idaluno))

      if (novos.length === 0) {
        toast({
          title: 'Mensalidades já geradas',
          description: `Todos os alunos já têm mensalidade em ${mesRef}`,
          status: 'info',
          duration: 4000,
        })
        return
      }

      // Monta os registros para insert
      const inserts = novos.map((a: any) => {
        const dia = Math.min(a.dia_vencimento, new Date(ano, mes, 0).getDate()) // ajusta dias inválidos (ex: 31 em fev)
        const dataVenc = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
        return {
          aluno_id: a.idaluno,
          valor: a.valor_mensalidade ?? 0,
          mes_referencia: mesRef,
          data_vencimento: dataVenc,
          situacao: 0,
        }
      })

      const { error: insertError } = await supabase.from('mensalidade').insert(inserts)
      if (insertError) throw insertError

      toast({
        title: `${novos.length} mensalidade${novos.length !== 1 ? 's' : ''} gerada${novos.length !== 1 ? 's' : ''}!`,
        description: `Mês: ${mesRef}`,
        status: 'success',
        duration: 4000,
      })
      loadMensalidades()
      checkAlunosSemMensalidade()
    } catch (err: any) {
      toast({ title: 'Erro ao gerar mensalidades', description: err.message, status: 'error', duration: 4000 })
    } finally {
      setGenerating(false)
    }
  }

  const confirmPayment = async () => {
    if (!confirmingMensalidade) return
    setConfirming(true)
    try {
      const today = new Date().toISOString().slice(0, 10)
      const { error } = await supabase
        .from('mensalidade')
        .update({ situacao: 1, data_pagamento: today })
        .eq('idmensalidade', confirmingMensalidade.idmensalidade)

      if (error) throw error

      toast({ title: 'Pagamento confirmado!', status: 'success', duration: 3000 })
      loadMensalidades()
    } catch (err: any) {
      toast({ title: 'Erro ao confirmar pagamento', description: err.message, status: 'error', duration: 4000 })
    } finally {
      setConfirming(false)
      onConfirmClose()
      setConfirmingMensalidade(null)
    }
  }

  // Filters
  const filtered = mensalidades.filter((m) => {
    const matchSearch =
      !search ||
      (m.aluno?.nome ?? '').toLowerCase().includes(search.toLowerCase()) ||
      m.mes_referencia.toLowerCase().includes(search.toLowerCase())

    const matchSituacao = !filtroSituacao || m.situacao === Number(filtroSituacao)

    const matchMes = !filtroMes || m.mes_referencia === filtroMes

    return matchSearch && matchSituacao && matchMes
  })

  const totalPendentes = mensalidades.filter((m) => m.situacao === 0).length
  const totalPagas = mensalidades.filter((m) => m.situacao === 1).length
  const totalVencidas = mensalidades.filter((m) => m.situacao === 2).length

  // Valores monetários
  const valorPendentes = mensalidades
    .filter((m) => m.situacao === 0)
    .reduce((sum, m) => sum + m.valor, 0)
  const valorAtrasadas = mensalidades
    .filter((m) => m.situacao === 2)
    .reduce((sum, m) => sum + m.valor, 0)
  const valorPagas = mensalidades
    .filter((m) => m.situacao === 1)
    .reduce((sum, m) => sum + m.valor, 0)

  // Receita prevista do mês atual
  const mesAtualRef = (() => {
    const now = new Date()
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    return `${meses[now.getMonth()]}/${now.getFullYear()}`
  })()
  const mensalidadesMesAtual = mensalidades.filter((m) => m.mes_referencia === mesAtualRef)
  const valorMesAtual = mensalidadesMesAtual.reduce((sum, m) => sum + m.valor, 0)

  const formatDate = (date: string | null) => {
    if (!date) return '—'
    return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')
  }

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const situacaoInfo = (s: number) => {
    switch (s) {
      case 0:
        return { label: 'Pendente', color: 'yellow', icon: FiClock }
      case 1:
        return { label: 'Pago', color: 'green', icon: FiCheckCircle }
      case 2:
        return { label: 'Atrasada', color: 'red', icon: FiAlertTriangle }
      default:
        return { label: 'Desconhecido', color: 'gray', icon: FiClock }
    }
  }

  // Generate list of unique months for filter
  const mesesUnicos = [...new Set(mensalidades.map((m) => m.mes_referencia))].sort().reverse()

  return (
    <AppLayout>
      <Box p={{ base: 4, md: 6, lg: 8 }} maxW="1400px" w="full" mx="auto">
        {/* Banner: alunos sem mensalidade no mês atual */}
        {alunosSemMensalidade > 0 && (
          <Flex
            bg="orange.50"
            border="1px solid"
            borderColor="orange.200"
            rounded="2xl"
            px={5}
            py={4}
            mb={5}
            align="center"
            justify="space-between"
            gap={4}
            wrap="wrap"
          >
            <HStack spacing={3}>
              <Flex w={9} h={9} rounded="xl" bg="orange.100" align="center" justify="center" flexShrink={0}>
                <Icon as={FiBell} boxSize={5} color="orange.500" />
              </Flex>
              <Box>
                <Text fontSize="sm" fontWeight="700" color="orange.700">
                  {alunosSemMensalidade} aluno{alunosSemMensalidade !== 1 ? 's' : ''} sem mensalidade em {getMesAtualRef()}
                </Text>
                <Text fontSize="xs" color="orange.500">
                  Clique em "Gerar Mês Atual" para criar as mensalidades pendentes.
                </Text>
              </Box>
            </HStack>
            <Button
              size="sm"
              colorScheme="orange"
              rounded="xl"
              leftIcon={<FiZap />}
              onClick={gerarMensalidadesMes}
              isLoading={generating}
              loadingText="Gerando..."
            >
              Gerar Agora
            </Button>
          </Flex>
        )}

        {/* Summary Cards */}
        <Flex gap={4} mb={6} wrap="wrap">
          <Flex
            bg="white"
            rounded="2xl"
            px={5}
            py={4}
            align="center"
            gap={3}
            border="1px solid"
            borderColor="gray.100"
            flex="1"
            minW="200px"
          >
            <Flex w={10} h={10} rounded="xl" bg="yellow.50" align="center" justify="center">
              <Icon as={FiClock} boxSize={5} color="yellow.500" />
            </Flex>
            <Box>
              <Text fontSize="lg" fontWeight="bold" color="yellow.600" lineHeight="1">
                {formatCurrency(valorPendentes)}
              </Text>
              <Text fontSize="xs" color="gray.400" fontWeight="500" mt={0.5}>
                Pendentes ({totalPendentes})
              </Text>
            </Box>
          </Flex>

          <Flex
            bg="white"
            rounded="2xl"
            px={5}
            py={4}
            align="center"
            gap={3}
            border="1px solid"
            borderColor="gray.100"
            flex="1"
            minW="200px"
          >
            <Flex w={10} h={10} rounded="xl" bg="red.50" align="center" justify="center">
              <Icon as={FiAlertTriangle} boxSize={5} color="red.500" />
            </Flex>
            <Box>
              <Text fontSize="lg" fontWeight="bold" color="red.500" lineHeight="1">
                {formatCurrency(valorAtrasadas)}
              </Text>
              <Text fontSize="xs" color="gray.400" fontWeight="500" mt={0.5}>
                Atrasadas ({totalVencidas})
              </Text>
            </Box>
          </Flex>

          <Flex
            bg="white"
            rounded="2xl"
            px={5}
            py={4}
            align="center"
            gap={3}
            border="1px solid"
            borderColor="gray.100"
            flex="1"
            minW="200px"
          >
            <Flex w={10} h={10} rounded="xl" bg="green.50" align="center" justify="center">
              <Icon as={FiCheckCircle} boxSize={5} color="green.500" />
            </Flex>
            <Box>
              <Text fontSize="lg" fontWeight="bold" color="green.500" lineHeight="1">
                {formatCurrency(valorPagas)}
              </Text>
              <Text fontSize="xs" color="gray.400" fontWeight="500" mt={0.5}>
                Recebido ({totalPagas})
              </Text>
            </Box>
          </Flex>

          <Flex
            bg="white"
            rounded="2xl"
            px={5}
            py={4}
            align="center"
            gap={3}
            border="1px solid"
            borderColor="gray.100"
            flex="1"
            minW="200px"
          >
            <Flex w={10} h={10} rounded="xl" bg="brand.50" align="center" justify="center">
              <Icon as={FiCalendar} boxSize={5} color="brand.500" />
            </Flex>
            <Box>
              <Text fontSize="lg" fontWeight="bold" color="brand.500" lineHeight="1">
                {formatCurrency(valorMesAtual)}
              </Text>
              <Text fontSize="xs" color="gray.400" fontWeight="500" mt={0.5}>
                Receita {mesAtualRef.split('/')[0]}
              </Text>
            </Box>
          </Flex>
        </Flex>

        {/* Toolbar */}
        <Flex
          bg="white"
          rounded="2xl"
          shadow="sm"
          border="1px solid"
          borderColor="gray.100"
          p={4}
          mb={5}
          gap={3}
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'stretch', md: 'center' }}
          justify="space-between"
        >
          <HStack spacing={3} flex={1}>
            <InputGroup maxW={{ md: '300px' }}>
              <InputLeftElement pointerEvents="none">
                <Icon as={FiSearch} color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Buscar por aluno ou mês..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                rounded="xl"
                bg="gray.50"
                border="1px solid"
                borderColor="gray.200"
                _focus={{ bg: 'white', borderColor: 'brand.500' }}
              />
            </InputGroup>

            <Select
              placeholder="Todos os status"
              value={filtroSituacao}
              onChange={(e) => setFiltroSituacao(e.target.value)}
              maxW="180px"
              rounded="xl"
              bg="gray.50"
              border="1px solid"
              borderColor="gray.200"
              _focus={{ bg: 'white', borderColor: 'brand.500' }}
              display={{ base: 'none', md: 'block' }}
            >
              <option value="0">Pendentes</option>
              <option value="2">Atrasadas</option>
              <option value="1">Pagas</option>
            </Select>

            <Select
              placeholder="Todos os meses"
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              maxW="200px"
              rounded="xl"
              bg="gray.50"
              border="1px solid"
              borderColor="gray.200"
              _focus={{ bg: 'white', borderColor: 'brand.500' }}
              display={{ base: 'none', md: 'block' }}
            >
              {mesesUnicos.map((mes) => (
                <option key={mes} value={mes}>
                  {mes}
                </option>
              ))}
            </Select>
          </HStack>

          <HStack spacing={2}>
            <Tooltip label="Atualizar">
              <IconButton
                aria-label="Atualizar"
                icon={<FiRefreshCw />}
                variant="ghost"
                rounded="xl"
                color="gray.500"
                onClick={loadMensalidades}
              />
            </Tooltip>
            <Button
              leftIcon={<FiZap />}
              colorScheme="brand"
              rounded="xl"
              onClick={gerarMensalidadesMes}
              isLoading={generating}
              loadingText="Gerando..."
              px={5}
            >
              Gerar Mês Atual
            </Button>
          </HStack>
        </Flex>

        {/* Table */}
        <Box
          bg="white"
          rounded="2xl"
          shadow="sm"
          border="1px solid"
          borderColor="gray.100"
          overflow="hidden"
        >
          {loading ? (
            <VStack p={6} spacing={3}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} h="50px" w="full" rounded="lg" />
              ))}
            </VStack>
          ) : filtered.length === 0 ? (
            <Flex p={12} justify="center" align="center" direction="column">
              <Icon as={FiDollarSign} boxSize={12} color="gray.300" mb={3} />
              <Text color="gray.400" fontSize="md" fontWeight="500">
                {search || filtroSituacao || filtroMes
                  ? 'Nenhuma mensalidade encontrada com esses filtros'
                  : 'Nenhuma mensalidade registrada ainda'}
              </Text>
            </Flex>
          ) : (
            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th color="gray.400" fontSize="xs" py={4}>
                      Aluno
                    </Th>
                    <Th color="gray.400" fontSize="xs" py={4}>
                      Mês Ref.
                    </Th>
                    <Th color="gray.400" fontSize="xs" py={4}>
                      Valor
                    </Th>
                    <Th color="gray.400" fontSize="xs" py={4} display={{ base: 'none', md: 'table-cell' }}>
                      Vencimento
                    </Th>
                    <Th color="gray.400" fontSize="xs" py={4} display={{ base: 'none', md: 'table-cell' }}>
                      Pagamento
                    </Th>
                    <Th color="gray.400" fontSize="xs" py={4}>
                      Status
                    </Th>
                    <Th color="gray.400" fontSize="xs" py={4} isNumeric>
                      Ação
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filtered.map((m) => {
                    const st = situacaoInfo(m.situacao)
                    return (
                      <Tr key={m.idmensalidade} _hover={{ bg: 'gray.50' }} transition="background 0.15s">
                        <Td py={3}>
                          <HStack spacing={3}>
                            <Avatar size="sm" name={m.aluno?.nome} bg="brand.100" color="brand.700" />
                            <Text fontSize="sm" fontWeight="600" color="gray.700">
                              {m.aluno?.nome ?? '—'}
                            </Text>
                          </HStack>
                        </Td>
                        <Td py={3}>
                          <Tag size="sm" colorScheme="brand" variant="subtle" rounded="full">
                            {m.mes_referencia}
                          </Tag>
                        </Td>
                        <Td py={3}>
                          <Text fontSize="sm" fontWeight="700" color="gray.700">
                            {formatCurrency(m.valor)}
                          </Text>
                        </Td>
                        <Td py={3} display={{ base: 'none', md: 'table-cell' }}>
                          <HStack spacing={1}>
                            <Icon as={FiCalendar} boxSize={3} color="gray.400" />
                            <Text fontSize="sm" color="gray.600">
                              {formatDate(m.data_vencimento)}
                            </Text>
                          </HStack>
                        </Td>
                        <Td py={3} display={{ base: 'none', md: 'table-cell' }}>
                          <Text fontSize="sm" color="gray.600">
                            {m.data_pagamento ? formatDate(m.data_pagamento) : '—'}
                          </Text>
                        </Td>
                        <Td py={3}>
                          <Badge
                            colorScheme={st.color}
                            rounded="full"
                            px={2.5}
                            py={0.5}
                            fontSize="xs"
                            fontWeight="600"
                          >
                            <HStack spacing={1}>
                              <Icon as={st.icon} boxSize={3} />
                              <Text>{st.label}</Text>
                            </HStack>
                          </Badge>
                        </Td>
                        <Td py={3} isNumeric>
                          {m.situacao !== 1 && (
                            <Tooltip label="Confirmar Pagamento">
                              <Button
                                size="sm"
                                colorScheme="green"
                                variant="outline"
                                rounded="xl"
                                leftIcon={<FiCheck />}
                                onClick={() => handleConfirmPayment(m)}
                              >
                                Pagar
                              </Button>
                            </Tooltip>
                          )}
                          {m.situacao === 1 && (
                            <Badge colorScheme="green" rounded="full" px={2} py={0.5} fontSize="xs">
                              Confirmado
                            </Badge>
                          )}
                        </Td>
                      </Tr>
                    )
                  })}
                </Tbody>
              </Table>
            </Box>
          )}

          {/* Footer count */}
          {!loading && filtered.length > 0 && (
            <Flex px={6} py={3} borderTop="1px solid" borderColor="gray.50" justify="space-between" align="center">
              <Text fontSize="xs" color="gray.400">
                Exibindo {filtered.length} de {mensalidades.length} mensalidade{mensalidades.length !== 1 ? 's' : ''}
              </Text>
            </Flex>
          )}
        </Box>
      </Box>

      {/* Confirm Payment Dialog */}
      <AlertDialog isOpen={isConfirmOpen} leastDestructiveRef={cancelRef as any} onClose={onConfirmClose} isCentered>
        <AlertDialogOverlay bg="blackAlpha.600" backdropFilter="blur(4px)">
          <AlertDialogContent rounded="2xl" mx={4}>
            <AlertDialogHeader fontSize="lg" fontWeight="700" color="gray.800">
              Confirmar Pagamento
            </AlertDialogHeader>
            <AlertDialogBody color="gray.600">
              <VStack align="start" spacing={2}>
                <Text>
                  Confirmar pagamento de{' '}
                  <Text as="span" fontWeight="700" color="gray.800">
                    {confirmingMensalidade ? formatCurrency(confirmingMensalidade.valor) : ''}
                  </Text>{' '}
                  referente a{' '}
                  <Text as="span" fontWeight="600">
                    {confirmingMensalidade?.mes_referencia}
                  </Text>
                  ?
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Aluno: {confirmingMensalidade?.aluno?.nome}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  A data de pagamento será registrada como hoje.
                </Text>
              </VStack>
            </AlertDialogBody>
            <AlertDialogFooter gap={3}>
              <Button ref={cancelRef as any} onClick={onConfirmClose} variant="ghost" rounded="xl">
                Cancelar
              </Button>
              <Button
                colorScheme="green"
                onClick={confirmPayment}
                isLoading={confirming}
                loadingText="Confirmando..."
                rounded="xl"
                leftIcon={<FiCheck />}
              >
                Confirmar Pagamento
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </AppLayout>
  )
}
