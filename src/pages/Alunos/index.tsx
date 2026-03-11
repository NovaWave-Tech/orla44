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
  InputGroup,
  InputLeftElement,
  Select,
  Button,
  Badge,
  Avatar,
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
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  Divider,
  Tooltip,
  Tag,
} from '@chakra-ui/react'
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiMoreVertical,
  FiMessageCircle,
  FiDollarSign,
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiPhone,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle,
  FiRefreshCw,
} from 'react-icons/fi'
import { useRef } from 'react'
import { supabase } from '../../lib/supabase'
import AppLayout from '../../components/AppLayout'
import AlunoFormModal, { type AlunoData } from './AlunoFormModal'

interface AlunoRow {
  idaluno: number
  nome: string
  telefone: string
  modalidade_id: number
  turma_id: number | null
  data_inicio: string | null
  dia_vencimento: number
  notificacao_whatsapp: number
  situacao: number
  observacao: string | null
  criado_em: string
  modalidade?: { nome: string }
  turma?: { nome: string; horario: string; dias_semana: string }
}

interface Mensalidade {
  idmensalidade: number
  valor: number
  mes_referencia: string
  data_vencimento: string
  data_pagamento: string | null
  situacao: number
}

export default function AlunosPage() {
  const toast = useToast()
  const [alunos, setAlunos] = useState<AlunoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroSituacao, setFiltroSituacao] = useState<string>('')
  const [filtroModalidade, setFiltroModalidade] = useState<string>('')
  const [modalidades, setModalidades] = useState<{ idmodalidade: number; nome: string }[]>([])

  // Modal form
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure()
  const [editingAluno, setEditingAluno] = useState<AlunoData | null>(null)

  // Deactivate dialog
  const { isOpen: isAlertOpen, onOpen: onAlertOpen, onClose: onAlertClose } = useDisclosure()
  const [togglingAluno, setTogglingAluno] = useState<AlunoRow | null>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  // Payment history drawer
  const { isOpen: isHistOpen, onOpen: onHistOpen, onClose: onHistClose } = useDisclosure()
  const [histAluno, setHistAluno] = useState<AlunoRow | null>(null)
  const [mensalidades, setMensalidades] = useState<Mensalidade[]>([])
  const [loadingHist, setLoadingHist] = useState(false)

  useEffect(() => {
    loadAlunos()
    loadModalidades()
  }, [])

  const loadAlunos = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('aluno')
        .select('*, modalidade:modalidade_id(nome), turma:turma_id(nome, horario, dias_semana)')
        .order('nome')

      if (error) throw error
      setAlunos(data ?? [])
    } catch (err: any) {
      toast({ title: 'Erro ao carregar alunos', description: err.message, status: 'error', duration: 4000 })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const loadModalidades = async () => {
    const { data } = await supabase.from('modalidade').select('idmodalidade, nome').eq('situacao', 1).order('nome')
    setModalidades(data ?? [])
  }

  const handleNew = () => {
    setEditingAluno(null)
    onFormOpen()
  }

  const handleEdit = (a: AlunoRow) => {
    setEditingAluno({
      idaluno: a.idaluno,
      nome: a.nome,
      telefone: a.telefone,
      modalidade_id: a.modalidade_id,
      turma_id: a.turma_id,
      data_inicio: a.data_inicio ?? '',
      dia_vencimento: a.dia_vencimento,
      notificacao_whatsapp: a.notificacao_whatsapp,
      situacao: a.situacao,
      observacao: a.observacao ?? '',
    })
    onFormOpen()
  }

  const handleToggleStatus = (a: AlunoRow) => {
    setTogglingAluno(a)
    onAlertOpen()
  }

  const confirmToggleStatus = async () => {
    if (!togglingAluno) return
    try {
      const newStatus = togglingAluno.situacao === 1 ? 0 : 1
      const { error } = await supabase
        .from('aluno')
        .update({ situacao: newStatus })
        .eq('idaluno', togglingAluno.idaluno)
      if (error) throw error
      toast({
        title: newStatus === 1 ? 'Aluno reativado' : 'Aluno desativado',
        status: 'success',
        duration: 3000,
      })
      loadAlunos()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, status: 'error', duration: 4000 })
    } finally {
      onAlertClose()
      setTogglingAluno(null)
    }
  }

  const handleWhatsApp = (telefone: string) => {
    const digits = telefone.replace(/\D/g, '')
    const number = digits.startsWith('55') ? digits : `55${digits}`
    window.open(`https://wa.me/${number}`, '_blank')
  }

  const handleHistorico = async (a: AlunoRow) => {
    setHistAluno(a)
    setLoadingHist(true)
    onHistOpen()
    try {
      const { data, error } = await supabase
        .from('mensalidade')
        .select('*')
        .eq('aluno_id', a.idaluno)
        .order('data_vencimento', { ascending: false })
      if (error) throw error
      setMensalidades(data ?? [])
    } catch (err: any) {
      toast({ title: 'Erro ao carregar histórico', description: err.message, status: 'error', duration: 4000 })
    } finally {
      setLoadingHist(false)
    }
  }

  // Filters
  const filtered = alunos.filter((a) => {
    const matchSearch =
      !search ||
      a.nome.toLowerCase().includes(search.toLowerCase()) ||
      a.telefone.includes(search)

    const matchSituacao = !filtroSituacao || a.situacao === Number(filtroSituacao)

    const matchModalidade = !filtroModalidade || a.modalidade_id === Number(filtroModalidade)

    return matchSearch && matchSituacao && matchModalidade
  })

  const totalAtivos = alunos.filter((a) => a.situacao === 1).length
  const totalInativos = alunos.filter((a) => a.situacao === 0).length

  const formatDate = (date: string | null) => {
    if (!date) return '—'
    return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')
  }

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const situacaoMensalidade = (s: number) => {
    switch (s) {
      case 0:
        return { label: 'Pendente', color: 'yellow', icon: FiClock }
      case 1:
        return { label: 'Pago', color: 'green', icon: FiCheckCircle }
      case 2:
        return { label: 'Vencido', color: 'red', icon: FiAlertTriangle }
      default:
        return { label: 'Desconhecido', color: 'gray', icon: FiXCircle }
    }
  }

  return (
    <AppLayout>
      <Box p={{ base: 4, md: 6, lg: 8 }} maxW="1400px" w="full" mx="auto">
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
            minW="160px"
          >
            <Flex w={10} h={10} rounded="xl" bg="brand.50" align="center" justify="center">
              <Icon as={FiUsers} boxSize={5} color="brand.500" />
            </Flex>
            <Box>
              <Text fontSize="2xl" fontWeight="bold" color="gray.800" lineHeight="1">
                {alunos.length}
              </Text>
              <Text fontSize="xs" color="gray.400" fontWeight="500">
                Total
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
            minW="160px"
          >
            <Flex w={10} h={10} rounded="xl" bg="palm.50" align="center" justify="center">
              <Icon as={FiUserCheck} boxSize={5} color="palm.500" />
            </Flex>
            <Box>
              <Text fontSize="2xl" fontWeight="bold" color="gray.800" lineHeight="1">
                {totalAtivos}
              </Text>
              <Text fontSize="xs" color="gray.400" fontWeight="500">
                Ativos
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
            minW="160px"
          >
            <Flex w={10} h={10} rounded="xl" bg="sunset.50" align="center" justify="center">
              <Icon as={FiUserX} boxSize={5} color="sunset.500" />
            </Flex>
            <Box>
              <Text fontSize="2xl" fontWeight="bold" color="gray.800" lineHeight="1">
                {totalInativos}
              </Text>
              <Text fontSize="xs" color="gray.400" fontWeight="500">
                Inativos
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
                placeholder="Buscar por nome ou telefone..."
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
              <option value="1">Ativos</option>
              <option value="0">Inativos</option>
            </Select>

            <Select
              placeholder="Todas modalidades"
              value={filtroModalidade}
              onChange={(e) => setFiltroModalidade(e.target.value)}
              maxW="200px"
              rounded="xl"
              bg="gray.50"
              border="1px solid"
              borderColor="gray.200"
              _focus={{ bg: 'white', borderColor: 'brand.500' }}
              display={{ base: 'none', md: 'block' }}
            >
              {modalidades.map((m) => (
                <option key={m.idmodalidade} value={m.idmodalidade}>
                  {m.nome}
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
                onClick={loadAlunos}
              />
            </Tooltip>
            <Button
              leftIcon={<FiPlus />}
              colorScheme="brand"
              rounded="xl"
              onClick={handleNew}
              px={6}
            >
              Novo Aluno
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
              <Icon as={FiUsers} boxSize={12} color="gray.300" mb={3} />
              <Text color="gray.400" fontSize="md" fontWeight="500">
                {search || filtroSituacao || filtroModalidade
                  ? 'Nenhum aluno encontrado com esses filtros'
                  : 'Nenhum aluno cadastrado ainda'}
              </Text>
              {!search && !filtroSituacao && !filtroModalidade && (
                <Button mt={4} colorScheme="brand" variant="outline" rounded="xl" onClick={handleNew} leftIcon={<FiPlus />}>
                  Cadastrar primeiro aluno
                </Button>
              )}
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
                      Telefone
                    </Th>
                    <Th color="gray.400" fontSize="xs" py={4} display={{ base: 'none', lg: 'table-cell' }}>
                      Modalidade / Turma
                    </Th>
                    <Th color="gray.400" fontSize="xs" py={4} display={{ base: 'none', md: 'table-cell' }}>
                      Vencimento
                    </Th>
                    <Th color="gray.400" fontSize="xs" py={4}>
                      Status
                    </Th>
                    <Th color="gray.400" fontSize="xs" py={4} isNumeric>
                      Ações
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filtered.map((aluno) => (
                    <Tr key={aluno.idaluno} _hover={{ bg: 'gray.50' }} transition="background 0.15s">
                      <Td py={3}>
                        <HStack spacing={3}>
                          <Avatar
                            size="sm"
                            name={aluno.nome}
                            bg={aluno.situacao === 1 ? 'brand.100' : 'gray.200'}
                            color={aluno.situacao === 1 ? 'brand.700' : 'gray.500'}
                          />
                          <Box>
                            <Text fontSize="sm" fontWeight="600" color="gray.700">
                              {aluno.nome}
                            </Text>
                            {aluno.data_inicio && (
                              <Text fontSize="xs" color="gray.400">
                                Desde {formatDate(aluno.data_inicio)}
                              </Text>
                            )}
                          </Box>
                        </HStack>
                      </Td>
                      <Td py={3}>
                        <HStack spacing={1}>
                          <Icon as={FiPhone} boxSize={3} color="gray.400" />
                          <Text fontSize="sm" color="gray.600">
                            {aluno.telefone}
                          </Text>
                        </HStack>
                      </Td>
                      <Td py={3} display={{ base: 'none', lg: 'table-cell' }}>
                        <VStack align="start" spacing={0}>
                          <Tag size="sm" colorScheme="brand" variant="subtle" rounded="full">
                            {aluno.modalidade?.nome ?? '—'}
                          </Tag>
                          {aluno.turma && (
                            <Text fontSize="xs" color="gray.400" mt={1}>
                              {aluno.turma.nome} • {aluno.turma.horario?.slice(0, 5)}
                            </Text>
                          )}
                        </VStack>
                      </Td>
                      <Td py={3} display={{ base: 'none', md: 'table-cell' }}>
                        <HStack spacing={1}>
                          <Icon as={FiCalendar} boxSize={3} color="gray.400" />
                          <Text fontSize="sm" color="gray.600">
                            Dia {aluno.dia_vencimento}
                          </Text>
                        </HStack>
                      </Td>
                      <Td py={3}>
                        <Badge
                          colorScheme={aluno.situacao === 1 ? 'green' : 'gray'}
                          rounded="full"
                          px={2.5}
                          py={0.5}
                          fontSize="xs"
                          fontWeight="600"
                        >
                          {aluno.situacao === 1 ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </Td>
                      <Td py={3} isNumeric>
                        <HStack spacing={1} justify="flex-end">
                          <Tooltip label="WhatsApp">
                            <IconButton
                              aria-label="WhatsApp"
                              icon={<FiMessageCircle />}
                              size="sm"
                              variant="ghost"
                              rounded="lg"
                              color="palm.500"
                              _hover={{ bg: 'palm.50' }}
                              onClick={() => handleWhatsApp(aluno.telefone)}
                            />
                          </Tooltip>
                          <Tooltip label="Histórico de pagamentos">
                            <IconButton
                              aria-label="Histórico"
                              icon={<FiDollarSign />}
                              size="sm"
                              variant="ghost"
                              rounded="lg"
                              color="golden.600"
                              _hover={{ bg: 'golden.50' }}
                              onClick={() => handleHistorico(aluno)}
                            />
                          </Tooltip>

                          <Menu>
                            <MenuButton
                              as={IconButton}
                              aria-label="Mais ações"
                              icon={<FiMoreVertical />}
                              size="sm"
                              variant="ghost"
                              rounded="lg"
                              color="gray.400"
                            />
                            <MenuList shadow="xl" rounded="xl" border="1px solid" borderColor="gray.100" py={1} minW="160px">
                              <MenuItem
                                icon={<Icon as={FiEdit2} />}
                                fontSize="sm"
                                color="gray.600"
                                _hover={{ bg: 'gray.50' }}
                                onClick={() => handleEdit(aluno)}
                              >
                                Editar
                              </MenuItem>
                              <MenuItem
                                icon={<Icon as={aluno.situacao === 1 ? FiUserX : FiUserCheck} />}
                                fontSize="sm"
                                color={aluno.situacao === 1 ? 'red.500' : 'palm.500'}
                                _hover={{ bg: aluno.situacao === 1 ? 'red.50' : 'palm.50' }}
                                onClick={() => handleToggleStatus(aluno)}
                              >
                                {aluno.situacao === 1 ? 'Desativar' : 'Reativar'}
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}

          {/* Footer count */}
          {!loading && filtered.length > 0 && (
            <Flex px={6} py={3} borderTop="1px solid" borderColor="gray.50" justify="space-between" align="center">
              <Text fontSize="xs" color="gray.400">
                Exibindo {filtered.length} de {alunos.length} aluno{alunos.length !== 1 ? 's' : ''}
              </Text>
            </Flex>
          )}
        </Box>
      </Box>

      {/* Form Modal */}
      <AlunoFormModal
        isOpen={isFormOpen}
        onClose={onFormClose}
        aluno={editingAluno}
        onSaved={loadAlunos}
      />

      {/* Deactivate / Reactivate Dialog */}
      <AlertDialog isOpen={isAlertOpen} leastDestructiveRef={cancelRef as any} onClose={onAlertClose} isCentered>
        <AlertDialogOverlay bg="blackAlpha.600" backdropFilter="blur(4px)">
          <AlertDialogContent rounded="2xl" mx={4}>
            <AlertDialogHeader fontSize="lg" fontWeight="700" color="gray.800">
              {togglingAluno?.situacao === 1 ? 'Desativar Aluno' : 'Reativar Aluno'}
            </AlertDialogHeader>
            <AlertDialogBody color="gray.600">
              {togglingAluno?.situacao === 1
                ? `Tem certeza que deseja desativar o aluno "${togglingAluno?.nome}"? Ele não aparecerá mais nas listas ativas.`
                : `Deseja reativar o aluno "${togglingAluno?.nome}"?`}
            </AlertDialogBody>
            <AlertDialogFooter gap={3}>
              <Button ref={cancelRef as any} onClick={onAlertClose} variant="ghost" rounded="xl">
                Cancelar
              </Button>
              <Button
                colorScheme={togglingAluno?.situacao === 1 ? 'red' : 'green'}
                onClick={confirmToggleStatus}
                rounded="xl"
              >
                {togglingAluno?.situacao === 1 ? 'Desativar' : 'Reativar'}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Payment History Drawer */}
      <Drawer isOpen={isHistOpen} onClose={onHistClose} size="md" placement="right">
        <DrawerOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <DrawerContent>
          <DrawerCloseButton rounded="xl" />
          <DrawerHeader borderBottom="1px solid" borderColor="gray.100">
            <HStack spacing={3}>
              <Avatar size="sm" name={histAluno?.nome} bg="brand.100" color="brand.700" />
              <Box>
                <Text fontSize="md" fontWeight="700" color="gray.800">
                  {histAluno?.nome}
                </Text>
                <Text fontSize="xs" color="gray.400">
                  Histórico de Pagamentos
                </Text>
              </Box>
            </HStack>
          </DrawerHeader>

          <DrawerBody p={0}>
            {loadingHist ? (
              <VStack p={6} spacing={3}>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} h="60px" w="full" rounded="lg" />
                ))}
              </VStack>
            ) : mensalidades.length === 0 ? (
              <Flex p={12} justify="center" align="center" direction="column">
                <Icon as={FiDollarSign} boxSize={10} color="gray.300" mb={3} />
                <Text color="gray.400" fontSize="sm">
                  Nenhuma mensalidade registrada
                </Text>
              </Flex>
            ) : (
              <VStack spacing={0} divider={<Divider />}>
                {mensalidades.map((m) => {
                  const st = situacaoMensalidade(m.situacao)
                  return (
                    <Flex
                      key={m.idmensalidade}
                      w="full"
                      px={6}
                      py={4}
                      align="center"
                      justify="space-between"
                      _hover={{ bg: 'gray.50' }}
                    >
                      <HStack spacing={3}>
                        <Flex
                          w={9}
                          h={9}
                          rounded="lg"
                          bg={`${st.color}.50`}
                          align="center"
                          justify="center"
                        >
                          <Icon as={st.icon} color={`${st.color}.500`} boxSize={4} />
                        </Flex>
                        <Box>
                          <Text fontSize="sm" fontWeight="600" color="gray.700">
                            {m.mes_referencia}
                          </Text>
                          <Text fontSize="xs" color="gray.400">
                            Venc. {formatDate(m.data_vencimento)}
                            {m.data_pagamento && ` • Pago ${formatDate(m.data_pagamento)}`}
                          </Text>
                        </Box>
                      </HStack>
                      <VStack spacing={0} align="end">
                        <Text fontSize="sm" fontWeight="700" color="gray.700">
                          {formatCurrency(m.valor)}
                        </Text>
                        <Badge colorScheme={st.color} rounded="full" fontSize="xs" px={2}>
                          {st.label}
                        </Badge>
                      </VStack>
                    </Flex>
                  )
                })}
              </VStack>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </AppLayout>
  )
}
