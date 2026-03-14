import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Box, Flex, Text, HStack, VStack, Icon, IconButton, Input, Select,
  Button, Badge, Table, Thead, Tbody, Tr, Th, Td, Skeleton, useDisclosure,
  useToast, AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader,
  AlertDialogContent, AlertDialogOverlay, Menu, MenuButton, MenuList, MenuItem,
  Tooltip, InputGroup, InputLeftElement,
} from '@chakra-ui/react'
import {
  FiTrendingDown, FiPlus, FiSearch, FiRefreshCw, FiEdit2, FiTrash2,
  FiMoreVertical, FiCalendar, FiTag, FiDollarSign,
} from 'react-icons/fi'
import { supabase } from '../../lib/supabase'
import AppLayout from '../../components/AppLayout'
import GastoFormModal, { type GastoData, CATEGORIAS_GASTO } from './GastoFormModal'

interface GastoRow {
  idgasto: number
  descricao: string
  valor: number
  categoria: string
  data: string
  observacao: string | null
  criado_em: string
}

const CATEGORIA_COLORS: Record<string, string> = {
  Aluguel: 'purple', Energia: 'yellow', Água: 'blue', Internet: 'cyan',
  Material: 'orange', Equipamentos: 'teal', Salário: 'green', Marketing: 'pink',
  Manutenção: 'red', Outros: 'gray',
}

const getMesLabel = (date: string) => {
  const [ano, mes] = date.split('-')
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${meses[Number(mes) - 1]}/${ano}`
}

const formatDate = (date: string) => {
  const [ano, mes, dia] = date.split('-')
  return `${dia}/${mes}/${ano}`
}

const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function GastosPage() {
  const toast = useToast()
  const [gastos, setGastos] = useState<GastoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroMes, setFiltroMes] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')

  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure()
  const [editingGasto, setEditingGasto] = useState<GastoData | null>(null)

  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
  const [deletingGasto, setDeletingGasto] = useState<GastoRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => { loadGastos() }, [])

  const loadGastos = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('gasto')
        .select('*')
        .order('data', { ascending: false })
      if (error) throw error
      setGastos(data ?? [])
    } catch (err: any) {
      toast({ title: 'Erro ao carregar gastos', description: err.message, status: 'error', duration: 4000, position: 'top' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const handleNew = () => { setEditingGasto(null); onFormOpen() }
  const handleEdit = (g: GastoRow) => {
    setEditingGasto({ idgasto: g.idgasto, descricao: g.descricao, valor: g.valor, categoria: g.categoria as any, data: g.data, observacao: g.observacao ?? '' })
    onFormOpen()
  }
  const handleDelete = (g: GastoRow) => { setDeletingGasto(g); onDeleteOpen() }

  const confirmDelete = async () => {
    if (!deletingGasto) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('gasto').delete().eq('idgasto', deletingGasto.idgasto)
      if (error) throw error
      toast({ title: 'Gasto excluído', status: 'success', duration: 3000, position: 'top' })
      loadGastos()
    } catch (err: any) {
      toast({ title: 'Erro ao excluir', description: err.message, status: 'error', duration: 4000, position: 'top' })
    } finally {
      setDeleting(false)
      onDeleteClose()
      setDeletingGasto(null)
    }
  }

  // Derived data
  const today = new Date()
  const mesAtual = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  const mesAnterior = (() => {
    const d = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })()

  const totalMesAtual = gastos.filter(g => g.data.startsWith(mesAtual)).reduce((s, g) => s + g.valor, 0)
  const totalMesAnterior = gastos.filter(g => g.data.startsWith(mesAnterior)).reduce((s, g) => s + g.valor, 0)
  const totalGeral = gastos.reduce((s, g) => s + g.valor, 0)

  const maiorCategoria = (() => {
    const map = new Map<string, number>()
    gastos.filter(g => g.data.startsWith(mesAtual)).forEach(g => map.set(g.categoria, (map.get(g.categoria) ?? 0) + g.valor))
    let max = 0; let cat = '—'
    map.forEach((v, k) => { if (v > max) { max = v; cat = k } })
    return { nome: cat, valor: max }
  })()

  const mesesUnicos = [...new Set(gastos.map(g => g.data.slice(0, 7)))].sort((a, b) => b.localeCompare(a))

  const filtered = gastos.filter(g => {
    const matchSearch = !search || g.descricao.toLowerCase().includes(search.toLowerCase())
    const matchMes = !filtroMes || g.data.startsWith(filtroMes)
    const matchCat = !filtroCategoria || g.categoria === filtroCategoria
    return matchSearch && matchMes && matchCat
  })

  const totalFiltered = filtered.reduce((s, g) => s + g.valor, 0)

  const variacaoPercent = totalMesAnterior > 0
    ? ((totalMesAtual - totalMesAnterior) / totalMesAnterior * 100).toFixed(1)
    : null

  return (
    <AppLayout>
      <Box p={{ base: 4, md: 6, lg: 8 }} maxW="1400px" w="full" mx="auto">

        {/* Summary cards */}
        <Flex gap={4} mb={6} wrap="wrap">
          <Flex bg="white" rounded="2xl" px={5} py={4} align="center" gap={3}
            border="1px solid" borderColor="gray.100" flex="1" minW="180px">
            <Flex w={10} h={10} rounded="xl" bg="sunset.50" align="center" justify="center">
              <Icon as={FiTrendingDown} boxSize={5} color="sunset.500" />
            </Flex>
            <Box>
              <Text fontSize="xl" fontWeight="bold" color="gray.800" lineHeight="1">{formatCurrency(totalMesAtual)}</Text>
              <Text fontSize="xs" color="gray.400" fontWeight="500" mt={0.5}>Gasto este mês</Text>
            </Box>
          </Flex>

          <Flex bg="white" rounded="2xl" px={5} py={4} align="center" gap={3}
            border="1px solid" borderColor="gray.100" flex="1" minW="180px">
            <Flex w={10} h={10} rounded="xl" bg="gray.100" align="center" justify="center">
              <Icon as={FiCalendar} boxSize={5} color="gray.500" />
            </Flex>
            <Box>
              <Text fontSize="xl" fontWeight="bold" color="gray.800" lineHeight="1">{formatCurrency(totalMesAnterior)}</Text>
              <Text fontSize="xs" mt={0.5} fontWeight="500">
                {variacaoPercent !== null ? (
                  <Text as="span" color={Number(variacaoPercent) > 0 ? 'red.500' : 'green.500'}>
                    {Number(variacaoPercent) > 0 ? '▲' : '▼'} {Math.abs(Number(variacaoPercent))}% vs mês ant.
                  </Text>
                ) : (
                  <Text as="span" color="gray.400">Mês anterior</Text>
                )}
              </Text>
            </Box>
          </Flex>

          <Flex bg="white" rounded="2xl" px={5} py={4} align="center" gap={3}
            border="1px solid" borderColor="gray.100" flex="1" minW="180px">
            <Flex w={10} h={10} rounded="xl" bg="golden.50" align="center" justify="center">
              <Icon as={FiTag} boxSize={5} color="golden.500" />
            </Flex>
            <Box>
              <Text fontSize="sm" fontWeight="700" color="gray.800" lineHeight="1.2">{maiorCategoria.nome}</Text>
              <Text fontSize="xs" color="gray.400" fontWeight="500" mt={0.5}>
                {maiorCategoria.valor > 0 ? formatCurrency(maiorCategoria.valor) : '—'} · maior categoria
              </Text>
            </Box>
          </Flex>

          <Flex bg="white" rounded="2xl" px={5} py={4} align="center" gap={3}
            border="1px solid" borderColor="gray.100" flex="1" minW="180px">
            <Flex w={10} h={10} rounded="xl" bg="brand.50" align="center" justify="center">
              <Icon as={FiDollarSign} boxSize={5} color="brand.500" />
            </Flex>
            <Box>
              <Text fontSize="xl" fontWeight="bold" color="gray.800" lineHeight="1">{formatCurrency(totalGeral)}</Text>
              <Text fontSize="xs" color="gray.400" fontWeight="500" mt={0.5}>Total geral</Text>
            </Box>
          </Flex>
        </Flex>

        {/* Toolbar */}
        <Flex bg="white" rounded="2xl" shadow="sm" border="1px solid" borderColor="gray.100"
          p={4} mb={5} gap={3} direction={{ base: 'column', md: 'row' }}
          align={{ base: 'stretch', md: 'center' }} justify="space-between">
          <HStack spacing={3} flex={1} wrap="wrap">
            <InputGroup maxW={{ md: '280px' }}>
              <InputLeftElement pointerEvents="none">
                <Icon as={FiSearch} color="gray.400" />
              </InputLeftElement>
              <Input placeholder="Buscar descrição..." value={search}
                onChange={e => setSearch(e.target.value)} rounded="xl" bg="gray.50"
                border="1px solid" borderColor="gray.200" _focus={{ bg: 'white', borderColor: 'brand.500' }} />
            </InputGroup>

            <Select placeholder="Todos os meses" value={filtroMes}
              onChange={e => setFiltroMes(e.target.value)} maxW="160px" rounded="xl"
              bg="gray.50" border="1px solid" borderColor="gray.200" _focus={{ bg: 'white', borderColor: 'brand.500' }}>
              {mesesUnicos.map(m => (
                <option key={m} value={m}>{getMesLabel(m + '-01')}</option>
              ))}
            </Select>

            <Select placeholder="Todas as categorias" value={filtroCategoria}
              onChange={e => setFiltroCategoria(e.target.value)} maxW="180px" rounded="xl"
              bg="gray.50" border="1px solid" borderColor="gray.200" _focus={{ bg: 'white', borderColor: 'brand.500' }}
              display={{ base: 'none', lg: 'block' }}>
              {CATEGORIAS_GASTO.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </HStack>

          <HStack spacing={2}>
            <Tooltip label="Atualizar">
              <IconButton aria-label="Atualizar" icon={<FiRefreshCw />} variant="ghost"
                rounded="xl" color="gray.500" onClick={loadGastos} />
            </Tooltip>
            <Button leftIcon={<FiPlus />} colorScheme="brand" rounded="xl" onClick={handleNew} px={6}>
              Novo Gasto
            </Button>
          </HStack>
        </Flex>

        {/* Table */}
        <Box bg="white" rounded="2xl" shadow="sm" border="1px solid" borderColor="gray.100" overflow="hidden">
          {loading ? (
            <VStack p={6} spacing={3}>
              {[1, 2, 3, 4].map(i => <Skeleton key={i} h="50px" w="full" rounded="lg" />)}
            </VStack>
          ) : filtered.length === 0 ? (
            <Flex p={12} justify="center" align="center" direction="column">
              <Icon as={FiTrendingDown} boxSize={12} color="gray.300" mb={3} />
              <Text color="gray.400" fontSize="md" fontWeight="500">
                {search || filtroMes || filtroCategoria ? 'Nenhum gasto com esses filtros' : 'Nenhum gasto registrado ainda'}
              </Text>
              {!search && !filtroMes && !filtroCategoria && (
                <Button mt={4} colorScheme="brand" variant="outline" rounded="xl" leftIcon={<FiPlus />} onClick={handleNew}>
                  Registrar primeiro gasto
                </Button>
              )}
            </Flex>
          ) : (
            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th color="gray.400" fontSize="xs" py={4}>Descrição</Th>
                    <Th color="gray.400" fontSize="xs" py={4}>Categoria</Th>
                    <Th color="gray.400" fontSize="xs" py={4} isNumeric>Valor</Th>
                    <Th color="gray.400" fontSize="xs" py={4} display={{ base: 'none', md: 'table-cell' }}>Data</Th>
                    <Th color="gray.400" fontSize="xs" py={4} isNumeric>Ações</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filtered.map(g => (
                    <Tr key={g.idgasto} _hover={{ bg: 'gray.50' }} transition="background 0.15s">
                      <Td py={3}>
                        <Text fontSize="sm" fontWeight="600" color="gray.700">{g.descricao}</Text>
                        {g.observacao && (
                          <Text fontSize="xs" color="gray.400" noOfLines={1}>{g.observacao}</Text>
                        )}
                      </Td>
                      <Td py={3}>
                        <Badge
                          colorScheme={CATEGORIA_COLORS[g.categoria] ?? 'gray'}
                          rounded="full" px={2.5} py={0.5} fontSize="xs" fontWeight="600"
                        >
                          {g.categoria}
                        </Badge>
                      </Td>
                      <Td py={3} isNumeric>
                        <Text fontSize="sm" fontWeight="700" color="sunset.600">
                          {formatCurrency(g.valor)}
                        </Text>
                      </Td>
                      <Td py={3} display={{ base: 'none', md: 'table-cell' }}>
                        <Text fontSize="sm" color="gray.500">{formatDate(g.data)}</Text>
                      </Td>
                      <Td py={3} isNumeric>
                        <Menu>
                          <MenuButton as={IconButton} aria-label="Ações" icon={<FiMoreVertical />}
                            size="sm" variant="ghost" rounded="lg" color="gray.400" />
                          <MenuList shadow="xl" rounded="xl" border="1px solid" borderColor="gray.100" py={1} minW="140px">
                            <MenuItem icon={<Icon as={FiEdit2} />} fontSize="sm" color="gray.600"
                              _hover={{ bg: 'gray.50' }} onClick={() => handleEdit(g)}>
                              Editar
                            </MenuItem>
                            <MenuItem icon={<Icon as={FiTrash2} />} fontSize="sm" color="red.500"
                              _hover={{ bg: 'red.50' }} onClick={() => handleDelete(g)}>
                              Excluir
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

          {!loading && filtered.length > 0 && (
            <Flex px={6} py={3} borderTop="1px solid" borderColor="gray.50" justify="space-between" align="center">
              <Text fontSize="xs" color="gray.400">
                Exibindo {filtered.length} de {gastos.length} gasto{gastos.length !== 1 ? 's' : ''}
              </Text>
              <Text fontSize="xs" fontWeight="700" color="sunset.600">
                Total filtrado: {formatCurrency(totalFiltered)}
              </Text>
            </Flex>
          )}
        </Box>
      </Box>

      <GastoFormModal isOpen={isFormOpen} onClose={onFormClose} gasto={editingGasto} onSaved={loadGastos} />

      <AlertDialog isOpen={isDeleteOpen} leastDestructiveRef={cancelRef as any} onClose={onDeleteClose} isCentered>
        <AlertDialogOverlay bg="blackAlpha.600" backdropFilter="blur(4px)">
          <AlertDialogContent rounded="2xl" mx={4}>
            <AlertDialogHeader fontSize="lg" fontWeight="700" color="gray.800">Excluir Gasto</AlertDialogHeader>
            <AlertDialogBody color="gray.600">
              Tem certeza que deseja excluir <Text as="span" fontWeight="600">"{deletingGasto?.descricao}"</Text>?
              Esta ação não pode ser desfeita.
            </AlertDialogBody>
            <AlertDialogFooter gap={3}>
              <Button ref={cancelRef as any} onClick={onDeleteClose} variant="ghost" rounded="xl">Cancelar</Button>
              <Button colorScheme="red" onClick={confirmDelete} isLoading={deleting} rounded="xl">Excluir</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </AppLayout>
  )
}
