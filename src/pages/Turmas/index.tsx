import { useEffect, useState, useCallback, useRef } from 'react'
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
  Tooltip,
  Tag,
  Wrap,
  WrapItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Avatar,
  Divider,
} from '@chakra-ui/react'
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiMoreVertical,
  FiLayers,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiUsers,
  FiClock,
} from 'react-icons/fi'
import { supabase } from '../../lib/supabase'
import AppLayout from '../../components/AppLayout'
import TurmaFormModal, { type TurmaData } from './TurmaFormModal'

interface TurmaRow {
  idturma: number
  nome: string
  modalidade_id: number
  dias_semana: string
  horario: string
  professor: string | null
  limite_alunos: number | null
  situacao: number
  criado_em: string
  modalidade?: { nome: string }
  _alunosCount?: number
}

interface AlunoSimples {
  idaluno: number
  nome: string
  telefone: string
  situacao: number
}

export default function TurmasPage() {
  const toast = useToast()
  const [turmas, setTurmas] = useState<TurmaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroSituacao, setFiltroSituacao] = useState<string>('')
  const [filtroModalidade, setFiltroModalidade] = useState<string>('')
  const [modalidades, setModalidades] = useState<{ idmodalidade: number; nome: string }[]>([])

  // Modal form
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure()
  const [editingTurma, setEditingTurma] = useState<TurmaData | null>(null)

  // Toggle status dialog
  const { isOpen: isAlertOpen, onOpen: onAlertOpen, onClose: onAlertClose } = useDisclosure()
  const [togglingTurma, setTogglingTurma] = useState<TurmaRow | null>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  // Alunos da turma modal
  const { isOpen: isAlunosOpen, onOpen: onAlunosOpen, onClose: onAlunosClose } = useDisclosure()
  const [viewingTurma, setViewingTurma] = useState<TurmaRow | null>(null)
  const [alunosTurma, setAlunosTurma] = useState<AlunoSimples[]>([])
  const [loadingAlunos, setLoadingAlunos] = useState(false)

  useEffect(() => {
    loadTurmas()
    loadModalidades()
  }, [])

  const loadTurmas = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('turma')
        .select('*, modalidade:modalidade_id(nome)')
        .order('nome')

      if (error) throw error

      // Count alunos per turma
      const turmasWithCount = await Promise.all(
        (data ?? []).map(async (t: any) => {
          const { count } = await supabase
            .from('aluno_turma')
            .select('aluno_id', { count: 'exact', head: true })
            .eq('turma_id', t.idturma)
          return { ...t, _alunosCount: count ?? 0 }
        })
      )

      setTurmas(turmasWithCount)
    } catch (err: any) {
      toast({ title: 'Erro ao carregar turmas', description: err.message, status: 'error', duration: 4000 })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const loadModalidades = async () => {
    const { data } = await supabase.from('modalidade').select('idmodalidade, nome').eq('situacao', 1).order('nome')
    setModalidades(data ?? [])
  }

  const handleNew = () => {
    setEditingTurma(null)
    onFormOpen()
  }

  const handleEdit = (t: TurmaRow) => {
    setEditingTurma({
      idturma: t.idturma,
      nome: t.nome,
      modalidade_id: t.modalidade_id,
      dias_semana: t.dias_semana,
      horario: t.horario?.slice(0, 5) ?? '',
      professor: t.professor ?? '',
      limite_alunos: t.limite_alunos ?? '',
      situacao: t.situacao,
    })
    onFormOpen()
  }

  const handleToggleStatus = (t: TurmaRow) => {
    setTogglingTurma(t)
    onAlertOpen()
  }

  const handleVerAlunos = async (t: TurmaRow) => {
    setViewingTurma(t)
    setAlunosTurma([])
    onAlunosOpen()
    setLoadingAlunos(true)
    try {
      const { data, error } = await supabase
        .from('aluno_turma')
        .select('aluno:aluno_id(idaluno, nome, telefone, situacao)')
        .eq('turma_id', t.idturma)
      if (error) throw error
      const lista = (data ?? []).map((r: any) => r.aluno).filter(Boolean)
      lista.sort((a: any, b: any) => a.nome.localeCompare(b.nome))
      setAlunosTurma(lista)
    } catch (err: any) {
      toast({ title: 'Erro ao carregar alunos', description: err.message, status: 'error', duration: 4000 })
    } finally {
      setLoadingAlunos(false)
    }
  }

  const confirmToggleStatus = async () => {
    if (!togglingTurma) return
    try {
      const newStatus = togglingTurma.situacao === 1 ? 0 : 1
      const { error } = await supabase
        .from('turma')
        .update({ situacao: newStatus })
        .eq('idturma', togglingTurma.idturma)
      if (error) throw error
      toast({
        title: newStatus === 1 ? 'Turma reativada' : 'Turma desativada',
        status: 'success',
        duration: 3000,
      })
      loadTurmas()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, status: 'error', duration: 4000 })
    } finally {
      onAlertClose()
      setTogglingTurma(null)
    }
  }

  // Filters
  const filtered = turmas.filter((t) => {
    const matchSearch =
      !search ||
      t.nome.toLowerCase().includes(search.toLowerCase()) ||
      (t.professor ?? '').toLowerCase().includes(search.toLowerCase())

    const matchSituacao = !filtroSituacao || t.situacao === Number(filtroSituacao)
    const matchModalidade = !filtroModalidade || t.modalidade_id === Number(filtroModalidade)

    return matchSearch && matchSituacao && matchModalidade
  })

  const totalAtivas = turmas.filter((t) => t.situacao === 1).length
  const totalInativas = turmas.filter((t) => t.situacao === 0).length

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
              <Icon as={FiLayers} boxSize={5} color="brand.500" />
            </Flex>
            <Box>
              <Text fontSize="2xl" fontWeight="bold" color="gray.800" lineHeight="1">
                {turmas.length}
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
              <Icon as={FiCheckCircle} boxSize={5} color="palm.500" />
            </Flex>
            <Box>
              <Text fontSize="2xl" fontWeight="bold" color="gray.800" lineHeight="1">
                {totalAtivas}
              </Text>
              <Text fontSize="xs" color="gray.400" fontWeight="500">
                Ativas
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
              <Icon as={FiXCircle} boxSize={5} color="sunset.500" />
            </Flex>
            <Box>
              <Text fontSize="2xl" fontWeight="bold" color="gray.800" lineHeight="1">
                {totalInativas}
              </Text>
              <Text fontSize="xs" color="gray.400" fontWeight="500">
                Inativas
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
                placeholder="Buscar por nome ou professor..."
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
              <option value="1">Ativas</option>
              <option value="0">Inativas</option>
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
                onClick={loadTurmas}
              />
            </Tooltip>
            <Button
              leftIcon={<FiPlus />}
              colorScheme="brand"
              rounded="xl"
              onClick={handleNew}
              px={6}
            >
              Nova Turma
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
              <Icon as={FiLayers} boxSize={12} color="gray.300" mb={3} />
              <Text color="gray.400" fontSize="md" fontWeight="500">
                {search || filtroSituacao || filtroModalidade
                  ? 'Nenhuma turma encontrada com esses filtros'
                  : 'Nenhuma turma cadastrada ainda'}
              </Text>
              {!search && !filtroSituacao && !filtroModalidade && (
                <Button mt={4} colorScheme="brand" variant="outline" rounded="xl" onClick={handleNew} leftIcon={<FiPlus />}>
                  Criar primeira turma
                </Button>
              )}
            </Flex>
          ) : (
            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th color="gray.400" fontSize="xs" py={4}>
                      Turma
                    </Th>
                    <Th color="gray.400" fontSize="xs" py={4}>
                      Modalidade
                    </Th>
                    <Th color="gray.400" fontSize="xs" py={4} display={{ base: 'none', lg: 'table-cell' }}>
                      Dias / Horário
                    </Th>
                    <Th color="gray.400" fontSize="xs" py={4} display={{ base: 'none', md: 'table-cell' }}>
                      Professor
                    </Th>
                    <Th color="gray.400" fontSize="xs" py={4} display={{ base: 'none', md: 'table-cell' }}>
                      Alunos
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
                  {filtered.map((turma) => (
                    <Tr key={turma.idturma} _hover={{ bg: 'gray.50' }} transition="background 0.15s">
                      <Td py={3}>
                        <Text fontSize="sm" fontWeight="600" color="gray.700">
                          {turma.nome}
                        </Text>
                      </Td>
                      <Td py={3}>
                        <Tag size="sm" colorScheme="brand" variant="subtle" rounded="full">
                          {turma.modalidade?.nome ?? '—'}
                        </Tag>
                      </Td>
                      <Td py={3} display={{ base: 'none', lg: 'table-cell' }}>
                        <VStack align="start" spacing={1}>
                          <Wrap spacing={1}>
                            {turma.dias_semana.split(', ').map((dia) => (
                              <WrapItem key={dia}>
                                <Tag size="sm" variant="subtle" colorScheme="gray" rounded="full">
                                  {dia}
                                </Tag>
                              </WrapItem>
                            ))}
                          </Wrap>
                          <HStack spacing={1}>
                            <Icon as={FiClock} boxSize={3} color="gray.400" />
                            <Text fontSize="xs" color="gray.500">
                              {turma.horario?.slice(0, 5)}
                            </Text>
                          </HStack>
                        </VStack>
                      </Td>
                      <Td py={3} display={{ base: 'none', md: 'table-cell' }}>
                        <Text fontSize="sm" color="gray.600">
                          {turma.professor ?? '—'}
                        </Text>
                      </Td>
                      <Td py={3} display={{ base: 'none', md: 'table-cell' }}>
                        <HStack spacing={1}>
                          <Icon as={FiUsers} boxSize={3} color="gray.400" />
                          <Text fontSize="sm" color="gray.600">
                            {turma._alunosCount ?? 0}
                            {turma.limite_alunos ? ` / ${turma.limite_alunos}` : ''}
                          </Text>
                        </HStack>
                      </Td>
                      <Td py={3}>
                        <Badge
                          colorScheme={turma.situacao === 1 ? 'green' : 'gray'}
                          rounded="full"
                          px={2.5}
                          py={0.5}
                          fontSize="xs"
                          fontWeight="600"
                        >
                          {turma.situacao === 1 ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </Td>
                      <Td py={3} isNumeric>
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
                              icon={<Icon as={FiUsers} />}
                              fontSize="sm"
                              color="gray.600"
                              _hover={{ bg: 'brand.50' }}
                              onClick={() => handleVerAlunos(turma)}
                            >
                              Ver Alunos
                            </MenuItem>
                            <MenuItem
                              icon={<Icon as={FiEdit2} />}
                              fontSize="sm"
                              color="gray.600"
                              _hover={{ bg: 'gray.50' }}
                              onClick={() => handleEdit(turma)}
                            >
                              Editar
                            </MenuItem>
                            <MenuItem
                              icon={<Icon as={turma.situacao === 1 ? FiXCircle : FiCheckCircle} />}
                              fontSize="sm"
                              color={turma.situacao === 1 ? 'red.500' : 'palm.500'}
                              _hover={{ bg: turma.situacao === 1 ? 'red.50' : 'palm.50' }}
                              onClick={() => handleToggleStatus(turma)}
                            >
                              {turma.situacao === 1 ? 'Desativar' : 'Reativar'}
                            </MenuItem>
                          </MenuList>
                        </Menu>
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
                Exibindo {filtered.length} de {turmas.length} turma{turmas.length !== 1 ? 's' : ''}
              </Text>
            </Flex>
          )}
        </Box>
      </Box>

      {/* Form Modal */}
      <TurmaFormModal
        isOpen={isFormOpen}
        onClose={onFormClose}
        turma={editingTurma}
        onSaved={loadTurmas}
      />

      {/* Alunos da Turma Modal */}
      <Modal isOpen={isAlunosOpen} onClose={onAlunosClose} size="md" isCentered scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent rounded="2xl" mx={4} maxH="80vh">
          <ModalHeader fontSize="lg" fontWeight="700" color="gray.800" pb={1}>
            {viewingTurma?.nome}
            {!loadingAlunos && (
              <Text as="span" fontSize="sm" fontWeight="400" color="gray.400" ml={2}>
                · {alunosTurma.length} aluno{alunosTurma.length !== 1 ? 's' : ''}
              </Text>
            )}
          </ModalHeader>
          <ModalCloseButton rounded="xl" />
          <ModalBody pb={5}>
            {loadingAlunos ? (
              <VStack spacing={3} py={2}>
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} h="56px" w="full" rounded="xl" />
                ))}
              </VStack>
            ) : alunosTurma.length === 0 ? (
              <Flex direction="column" align="center" py={10} gap={2}>
                <Flex w={12} h={12} rounded="2xl" bg="gray.50" align="center" justify="center">
                  <Icon as={FiUsers} boxSize={5} color="gray.300" />
                </Flex>
                <Text fontSize="sm" fontWeight="600" color="gray.400">Nenhum aluno nesta turma</Text>
              </Flex>
            ) : (
              <VStack spacing={0} divider={<Divider borderColor="gray.50" />}>
                {alunosTurma.map(a => (
                  <Flex key={a.idaluno} w="full" align="center" gap={3} py={3}>
                    <Avatar size="sm" name={a.nome} bg="brand.500" color="white" fontWeight="600" />
                    <Box flex={1} minW={0}>
                      <Text fontSize="sm" fontWeight="600" color="gray.800" noOfLines={1}>{a.nome}</Text>
                      <Text fontSize="xs" color="gray.400">{a.telefone || '—'}</Text>
                    </Box>
                    <Badge
                      colorScheme={a.situacao === 1 ? 'green' : 'gray'}
                      rounded="full" px={2} fontSize="xs" fontWeight="600"
                    >
                      {a.situacao === 1 ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </Flex>
                ))}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Toggle Status Dialog */}
      <AlertDialog isOpen={isAlertOpen} leastDestructiveRef={cancelRef as any} onClose={onAlertClose} isCentered>
        <AlertDialogOverlay bg="blackAlpha.600" backdropFilter="blur(4px)">
          <AlertDialogContent rounded="2xl" mx={4}>
            <AlertDialogHeader fontSize="lg" fontWeight="700" color="gray.800">
              {togglingTurma?.situacao === 1 ? 'Desativar Turma' : 'Reativar Turma'}
            </AlertDialogHeader>
            <AlertDialogBody color="gray.600">
              {togglingTurma?.situacao === 1
                ? `Tem certeza que deseja desativar a turma "${togglingTurma?.nome}"?`
                : `Deseja reativar a turma "${togglingTurma?.nome}"?`}
            </AlertDialogBody>
            <AlertDialogFooter gap={3}>
              <Button ref={cancelRef as any} onClick={onAlertClose} variant="ghost" rounded="xl">
                Cancelar
              </Button>
              <Button
                colorScheme={togglingTurma?.situacao === 1 ? 'red' : 'green'}
                onClick={confirmToggleStatus}
                rounded="xl"
              >
                {togglingTurma?.situacao === 1 ? 'Desativar' : 'Reativar'}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </AppLayout>
  )
}
