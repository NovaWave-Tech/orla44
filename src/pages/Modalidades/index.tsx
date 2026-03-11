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
} from '@chakra-ui/react'
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiMoreVertical,
  FiGrid,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiUsers,
} from 'react-icons/fi'
import { supabase } from '../../lib/supabase'
import AppLayout from '../../components/AppLayout'
import ModalidadeFormModal, { type ModalidadeData } from './ModalidadeFormModal'

interface ModalidadeRow {
  idmodalidade: number
  nome: string
  situacao: number
  criado_em: string
  _alunosCount?: number
  _turmasCount?: number
}

export default function ModalidadesPage() {
  const toast = useToast()
  const [modalidades, setModalidades] = useState<ModalidadeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroSituacao, setFiltroSituacao] = useState<string>('')

  // Form modal
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure()
  const [editingItem, setEditingItem] = useState<ModalidadeData | null>(null)

  // Toggle status dialog
  const { isOpen: isAlertOpen, onOpen: onAlertOpen, onClose: onAlertClose } = useDisclosure()
  const [togglingItem, setTogglingItem] = useState<ModalidadeRow | null>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    loadModalidades()
  }, [])

  const loadModalidades = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('modalidade')
        .select('*')
        .order('nome')

      if (error) throw error

      // Count alunos and turmas for each modalidade
      const rows: ModalidadeRow[] = data ?? []
      const ids = rows.map((m) => m.idmodalidade)

      if (ids.length > 0) {
        const [{ data: alunosCounts }, { data: turmasCounts }] = await Promise.all([
          supabase
            .from('aluno')
            .select('modalidade_id')
            .in('modalidade_id', ids)
            .eq('situacao', 1),
          supabase
            .from('turma')
            .select('modalidade_id')
            .in('modalidade_id', ids)
            .eq('situacao', 1),
        ])

        const alunosMap = new Map<number, number>()
        alunosCounts?.forEach((a) => {
          alunosMap.set(a.modalidade_id, (alunosMap.get(a.modalidade_id) ?? 0) + 1)
        })

        const turmasMap = new Map<number, number>()
        turmasCounts?.forEach((t) => {
          turmasMap.set(t.modalidade_id, (turmasMap.get(t.modalidade_id) ?? 0) + 1)
        })

        rows.forEach((m) => {
          m._alunosCount = alunosMap.get(m.idmodalidade) ?? 0
          m._turmasCount = turmasMap.get(m.idmodalidade) ?? 0
        })
      }

      setModalidades(rows)
    } catch (err: any) {
      toast({ title: 'Erro ao carregar modalidades', description: err.message, status: 'error', duration: 4000 })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const loadModalidades2 = async () => {
    await loadModalidades()
  }

  const handleNew = () => {
    setEditingItem(null)
    onFormOpen()
  }

  const handleEdit = (m: ModalidadeRow) => {
    setEditingItem({
      idmodalidade: m.idmodalidade,
      nome: m.nome,
      situacao: m.situacao,
    })
    onFormOpen()
  }

  const handleToggleStatus = (m: ModalidadeRow) => {
    setTogglingItem(m)
    onAlertOpen()
  }

  const confirmToggleStatus = async () => {
    if (!togglingItem) return
    try {
      const newStatus = togglingItem.situacao === 1 ? 0 : 1
      const { error } = await supabase
        .from('modalidade')
        .update({ situacao: newStatus })
        .eq('idmodalidade', togglingItem.idmodalidade)
      if (error) throw error
      toast({
        title: newStatus === 1 ? 'Modalidade reativada' : 'Modalidade desativada',
        status: 'success',
        duration: 3000,
      })
      loadModalidades()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, status: 'error', duration: 4000 })
    } finally {
      onAlertClose()
      setTogglingItem(null)
    }
  }

  // Filters
  const filtered = modalidades.filter((m) => {
    const matchSearch = !search || m.nome.toLowerCase().includes(search.toLowerCase())
    const matchSituacao = !filtroSituacao || m.situacao === Number(filtroSituacao)
    return matchSearch && matchSituacao
  })

  const totalAtivas = modalidades.filter((m) => m.situacao === 1).length
  const totalInativas = modalidades.filter((m) => m.situacao === 0).length

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR')
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
              <Icon as={FiGrid} boxSize={5} color="brand.500" />
            </Flex>
            <Box>
              <Text fontSize="2xl" fontWeight="bold" color="gray.800" lineHeight="1">
                {modalidades.length}
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
            <InputGroup maxW={{ md: '320px' }}>
              <InputLeftElement pointerEvents="none">
                <Icon as={FiSearch} color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Buscar modalidade..."
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
          </HStack>

          <HStack spacing={2}>
            <Tooltip label="Atualizar">
              <IconButton
                aria-label="Atualizar"
                icon={<FiRefreshCw />}
                variant="ghost"
                rounded="xl"
                color="gray.500"
                onClick={loadModalidades2}
              />
            </Tooltip>
            <Button
              leftIcon={<FiPlus />}
              colorScheme="brand"
              rounded="xl"
              onClick={handleNew}
              px={6}
            >
              Nova Modalidade
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
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} h="50px" w="full" rounded="lg" />
              ))}
            </VStack>
          ) : filtered.length === 0 ? (
            <Flex p={12} justify="center" align="center" direction="column">
              <Icon as={FiGrid} boxSize={12} color="gray.300" mb={3} />
              <Text color="gray.400" fontSize="md" fontWeight="500">
                {search || filtroSituacao
                  ? 'Nenhuma modalidade encontrada com esses filtros'
                  : 'Nenhuma modalidade cadastrada ainda'}
              </Text>
              {!search && !filtroSituacao && (
                <Button
                  mt={4}
                  colorScheme="brand"
                  variant="outline"
                  rounded="xl"
                  onClick={handleNew}
                  leftIcon={<FiPlus />}
                >
                  Cadastrar primeira modalidade
                </Button>
              )}
            </Flex>
          ) : (
            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th color="gray.400" fontSize="xs" py={4}>
                      Modalidade
                    </Th>
                    <Th color="gray.400" fontSize="xs" py={4} display={{ base: 'none', md: 'table-cell' }}>
                      Alunos Ativos
                    </Th>
                    <Th color="gray.400" fontSize="xs" py={4} display={{ base: 'none', md: 'table-cell' }}>
                      Turmas
                    </Th>
                    <Th color="gray.400" fontSize="xs" py={4} display={{ base: 'none', lg: 'table-cell' }}>
                      Criado em
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
                  {filtered.map((mod) => (
                    <Tr key={mod.idmodalidade} _hover={{ bg: 'gray.50' }} transition="background 0.15s">
                      <Td py={3}>
                        <HStack spacing={3}>
                          <Flex
                            w={9}
                            h={9}
                            rounded="xl"
                            bg={mod.situacao === 1 ? 'brand.50' : 'gray.100'}
                            align="center"
                            justify="center"
                          >
                            <Icon
                              as={FiGrid}
                              boxSize={4}
                              color={mod.situacao === 1 ? 'brand.500' : 'gray.400'}
                            />
                          </Flex>
                          <Text fontSize="sm" fontWeight="600" color="gray.700">
                            {mod.nome}
                          </Text>
                        </HStack>
                      </Td>
                      <Td py={3} display={{ base: 'none', md: 'table-cell' }}>
                        <HStack spacing={1}>
                          <Icon as={FiUsers} boxSize={3} color="gray.400" />
                          <Text fontSize="sm" color="gray.600">
                            {mod._alunosCount ?? 0}
                          </Text>
                        </HStack>
                      </Td>
                      <Td py={3} display={{ base: 'none', md: 'table-cell' }}>
                        <Text fontSize="sm" color="gray.600">
                          {mod._turmasCount ?? 0}
                        </Text>
                      </Td>
                      <Td py={3} display={{ base: 'none', lg: 'table-cell' }}>
                        <Text fontSize="sm" color="gray.500">
                          {formatDate(mod.criado_em)}
                        </Text>
                      </Td>
                      <Td py={3}>
                        <Badge
                          colorScheme={mod.situacao === 1 ? 'green' : 'gray'}
                          rounded="full"
                          px={2.5}
                          py={0.5}
                          fontSize="xs"
                          fontWeight="600"
                        >
                          {mod.situacao === 1 ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </Td>
                      <Td py={3} isNumeric>
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            aria-label="Ações"
                            icon={<FiMoreVertical />}
                            size="sm"
                            variant="ghost"
                            rounded="lg"
                            color="gray.400"
                          />
                          <MenuList
                            shadow="xl"
                            rounded="xl"
                            border="1px solid"
                            borderColor="gray.100"
                            py={1}
                            minW="160px"
                          >
                            <MenuItem
                              icon={<Icon as={FiEdit2} />}
                              fontSize="sm"
                              color="gray.600"
                              _hover={{ bg: 'gray.50' }}
                              onClick={() => handleEdit(mod)}
                            >
                              Editar
                            </MenuItem>
                            <MenuItem
                              icon={<Icon as={mod.situacao === 1 ? FiXCircle : FiCheckCircle} />}
                              fontSize="sm"
                              color={mod.situacao === 1 ? 'red.500' : 'palm.500'}
                              _hover={{ bg: mod.situacao === 1 ? 'red.50' : 'palm.50' }}
                              onClick={() => handleToggleStatus(mod)}
                            >
                              {mod.situacao === 1 ? 'Desativar' : 'Reativar'}
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
                Exibindo {filtered.length} de {modalidades.length} modalidade{modalidades.length !== 1 ? 's' : ''}
              </Text>
            </Flex>
          )}
        </Box>
      </Box>

      {/* Form Modal */}
      <ModalidadeFormModal
        isOpen={isFormOpen}
        onClose={onFormClose}
        modalidade={editingItem}
        onSaved={loadModalidades2}
      />

      {/* Toggle Status Dialog */}
      <AlertDialog isOpen={isAlertOpen} leastDestructiveRef={cancelRef as any} onClose={onAlertClose} isCentered>
        <AlertDialogOverlay bg="blackAlpha.600" backdropFilter="blur(4px)">
          <AlertDialogContent rounded="2xl" mx={4}>
            <AlertDialogHeader fontSize="lg" fontWeight="700" color="gray.800">
              {togglingItem?.situacao === 1 ? 'Desativar Modalidade' : 'Reativar Modalidade'}
            </AlertDialogHeader>
            <AlertDialogBody color="gray.600">
              {togglingItem?.situacao === 1
                ? `Tem certeza que deseja desativar a modalidade "${togglingItem?.nome}"? Turmas e alunos vinculados não serão afetados.`
                : `Deseja reativar a modalidade "${togglingItem?.nome}"?`}
            </AlertDialogBody>
            <AlertDialogFooter gap={3}>
              <Button ref={cancelRef as any} onClick={onAlertClose} variant="ghost" rounded="xl">
                Cancelar
              </Button>
              <Button
                colorScheme={togglingItem?.situacao === 1 ? 'red' : 'green'}
                onClick={confirmToggleStatus}
                rounded="xl"
              >
                {togglingItem?.situacao === 1 ? 'Desativar' : 'Reativar'}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </AppLayout>
  )
}
