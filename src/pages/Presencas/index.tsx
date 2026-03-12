import { useEffect, useState, useCallback } from 'react'
import {
  Box,
  Flex,
  Text,
  HStack,
  VStack,
  Icon,
  IconButton,
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
  useToast,
  Tooltip,
  Avatar,
  Input,
  Checkbox,
  Tag,
} from '@chakra-ui/react'
import {
  FiCheckSquare,
  FiRefreshCw,
  FiCheck,
  FiX,
  FiUsers,
  FiSave,
  FiCalendar,
} from 'react-icons/fi'
import { supabase } from '../../lib/supabase'
import AppLayout from '../../components/AppLayout'

interface Turma {
  idturma: number
  nome: string
  modalidade_id: number
  dias_semana: string
  horario: string
  modalidade?: { nome: string }
}

interface AlunoTurma {
  idaluno: number
  nome: string
  telefone: string
}

interface PresencaRow {
  idpresenca: number
  aluno_id: number
  turma_id: number
  data_treino: string
  situacao: number
}

interface PresencaState {
  aluno_id: number
  presente: boolean
  existing?: PresencaRow
}

export default function PresencasPage() {
  const toast = useToast()
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [selectedTurma, setSelectedTurma] = useState<string>('')
  const [dataTreino, setDataTreino] = useState<string>(new Date().toISOString().slice(0, 10))
  const [alunos, setAlunos] = useState<AlunoTurma[]>([])
  const [presencas, setPresencas] = useState<PresencaState[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingTurmas, setLoadingTurmas] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadTurmas()
  }, [])

  useEffect(() => {
    if (selectedTurma && dataTreino) {
      loadPresencas()
    }
  }, [selectedTurma, dataTreino])

  const loadTurmas = async () => {
    setLoadingTurmas(true)
    try {
      const { data, error } = await supabase
        .from('turma')
        .select('*, modalidade:modalidade_id(nome)')
        .eq('situacao', 1)
        .order('nome')

      if (error) throw error
      setTurmas(data ?? [])
    } catch (err: any) {
      toast({ title: 'Erro ao carregar turmas', description: err.message, status: 'error', duration: 4000 })
    } finally {
      setLoadingTurmas(false)
    }
  }

  const loadPresencas = useCallback(async () => {
    if (!selectedTurma) return

    setLoading(true)
    try {
      // Load alunos from this turma
      const { data: alunosData, error: alunosError } = await supabase
        .from('aluno')
        .select('idaluno, nome, telefone')
        .eq('turma_id', Number(selectedTurma))
        .eq('situacao', 1)
        .order('nome')

      if (alunosError) throw alunosError
      setAlunos(alunosData ?? [])

      // Load existing presencas for this date and turma
      const { data: presencaData, error: presencaError } = await supabase
        .from('presenca')
        .select('*')
        .eq('turma_id', Number(selectedTurma))
        .eq('data_treino', dataTreino)

      if (presencaError) throw presencaError

      // Map presencas
      const presencaMap = new Map<number, PresencaRow>()
      ;(presencaData ?? []).forEach((p: PresencaRow) => presencaMap.set(p.aluno_id, p))

      const estados: PresencaState[] = (alunosData ?? []).map((aluno: AlunoTurma) => {
        const existing = presencaMap.get(aluno.idaluno)
        return {
          aluno_id: aluno.idaluno,
          presente: existing ? existing.situacao === 1 : false,
          existing,
        }
      })

      setPresencas(estados)
    } catch (err: any) {
      toast({ title: 'Erro ao carregar presenças', description: err.message, status: 'error', duration: 4000 })
    } finally {
      setLoading(false)
    }
  }, [selectedTurma, dataTreino, toast])

  const togglePresenca = (alunoId: number) => {
    setPresencas((prev) =>
      prev.map((p) =>
        p.aluno_id === alunoId ? { ...p, presente: !p.presente } : p
      )
    )
  }

  const marcarTodos = (presente: boolean) => {
    setPresencas((prev) => prev.map((p) => ({ ...p, presente })))
  }

  const handleSave = async () => {
    if (!selectedTurma) return

    setSaving(true)
    try {
      const turmaId = Number(selectedTurma)

      for (const p of presencas) {
        if (p.existing) {
          // Update existing
          await supabase
            .from('presenca')
            .update({ situacao: p.presente ? 1 : 0 })
            .eq('idpresenca', p.existing.idpresenca)
        } else {
          // Insert new
          await supabase.from('presenca').insert({
            aluno_id: p.aluno_id,
            turma_id: turmaId,
            data_treino: dataTreino,
            situacao: p.presente ? 1 : 0,
          })
        }
      }

      toast({ title: 'Presenças salvas com sucesso!', status: 'success', duration: 3000 })
      loadPresencas() // Reload to get IDs
    } catch (err: any) {
      toast({ title: 'Erro ao salvar presenças', description: err.message, status: 'error', duration: 4000 })
    } finally {
      setSaving(false)
    }
  }

  const totalPresentes = presencas.filter((p) => p.presente).length
  const totalFaltas = presencas.filter((p) => !p.presente).length

  const selectedTurmaObj = turmas.find((t) => t.idturma === Number(selectedTurma))

  // Check if selected date matches turma's scheduled days
  const getDiaSemana = (dateStr: string) => {
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const d = new Date(dateStr + 'T00:00:00')
    return dias[d.getDay()]
  }

  const isDiaAgendado = selectedTurmaObj
    ? selectedTurmaObj.dias_semana.includes(getDiaSemana(dataTreino))
    : true

  return (
    <AppLayout>
      <Box p={{ base: 4, md: 6, lg: 8 }} maxW="1400px" w="full" mx="auto">
        {/* Header / Filters */}
        <Flex
          bg="white"
          rounded="2xl"
          shadow="sm"
          border="1px solid"
          borderColor="gray.100"
          p={5}
          mb={5}
          gap={4}
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'stretch', md: 'flex-end' }}
        >
          <Box flex={1}>
            <Text fontSize="sm" fontWeight="600" color="gray.600" mb={1}>
              Turma
            </Text>
            <Select
              placeholder="Selecione uma turma"
              value={selectedTurma}
              onChange={(e) => setSelectedTurma(e.target.value)}
              rounded="xl"
              bg="gray.50"
              border="1px solid"
              borderColor="gray.200"
              _focus={{ bg: 'white', borderColor: 'brand.500' }}
              isDisabled={loadingTurmas}
            >
              {turmas.map((t) => (
                <option key={t.idturma} value={t.idturma}>
                  {t.nome} — {t.modalidade?.nome} ({t.horario?.slice(0, 5)})
                </option>
              ))}
            </Select>
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="600" color="gray.600" mb={1}>
              Data do Treino
            </Text>
            <Input
              type="date"
              value={dataTreino}
              onChange={(e) => setDataTreino(e.target.value)}
              rounded="xl"
              bg="gray.50"
              border="1px solid"
              borderColor="gray.200"
              _focus={{ bg: 'white', borderColor: 'brand.500' }}
              maxW="200px"
            />
          </Box>

          <HStack spacing={2}>
            <Tooltip label="Atualizar">
              <IconButton
                aria-label="Atualizar"
                icon={<FiRefreshCw />}
                variant="ghost"
                rounded="xl"
                color="gray.500"
                onClick={loadPresencas}
                isDisabled={!selectedTurma}
              />
            </Tooltip>
          </HStack>
        </Flex>

        {/* Warning: dia não agendado */}
        {selectedTurma && !isDiaAgendado && (
          <Flex
            bg="yellow.50"
            rounded="xl"
            px={4}
            py={3}
            mb={4}
            align="center"
            gap={2}
            border="1px solid"
            borderColor="yellow.200"
          >
            <Icon as={FiCalendar} color="yellow.600" />
            <Text fontSize="sm" color="yellow.700">
              Esta turma não tem aula agendada para <strong>{getDiaSemana(dataTreino)}</strong>. 
              Dias programados: <strong>{selectedTurmaObj?.dias_semana}</strong>
            </Text>
          </Flex>
        )}

        {!selectedTurma ? (
          <Flex
            bg="white"
            rounded="2xl"
            shadow="sm"
            border="1px solid"
            borderColor="gray.100"
            p={12}
            justify="center"
            align="center"
            direction="column"
          >
            <Icon as={FiCheckSquare} boxSize={12} color="gray.300" mb={3} />
            <Text color="gray.400" fontSize="md" fontWeight="500">
              Selecione uma turma para fazer a chamada
            </Text>
          </Flex>
        ) : (
          <>
            {/* Summary & Actions */}
            <Flex gap={4} mb={5} wrap="wrap" align="center" justify="space-between">
              <HStack spacing={4}>
                <Flex
                  bg="white"
                  rounded="2xl"
                  px={5}
                  py={3}
                  align="center"
                  gap={3}
                  border="1px solid"
                  borderColor="gray.100"
                >
                  <Icon as={FiUsers} color="brand.500" />
                  <Box>
                    <Text fontSize="lg" fontWeight="bold" color="gray.800" lineHeight="1">
                      {alunos.length}
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                      Alunos
                    </Text>
                  </Box>
                </Flex>

                <Flex
                  bg="white"
                  rounded="2xl"
                  px={5}
                  py={3}
                  align="center"
                  gap={3}
                  border="1px solid"
                  borderColor="gray.100"
                >
                  <Icon as={FiCheck} color="green.500" />
                  <Box>
                    <Text fontSize="lg" fontWeight="bold" color="gray.800" lineHeight="1">
                      {totalPresentes}
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                      Presentes
                    </Text>
                  </Box>
                </Flex>

                <Flex
                  bg="white"
                  rounded="2xl"
                  px={5}
                  py={3}
                  align="center"
                  gap={3}
                  border="1px solid"
                  borderColor="gray.100"
                >
                  <Icon as={FiX} color="red.500" />
                  <Box>
                    <Text fontSize="lg" fontWeight="bold" color="gray.800" lineHeight="1">
                      {totalFaltas}
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                      Faltas
                    </Text>
                  </Box>
                </Flex>
              </HStack>

              <HStack spacing={2}>
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="green"
                  rounded="xl"
                  onClick={() => marcarTodos(true)}
                >
                  Marcar Todos
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="red"
                  rounded="xl"
                  onClick={() => marcarTodos(false)}
                >
                  Desmarcar Todos
                </Button>
                <Button
                  colorScheme="brand"
                  rounded="xl"
                  leftIcon={<FiSave />}
                  onClick={handleSave}
                  isLoading={saving}
                  loadingText="Salvando..."
                  isDisabled={alunos.length === 0}
                  px={6}
                >
                  Salvar Presenças
                </Button>
              </HStack>
            </Flex>

            {/* Attendance Table */}
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
              ) : alunos.length === 0 ? (
                <Flex p={12} justify="center" align="center" direction="column">
                  <Icon as={FiUsers} boxSize={12} color="gray.300" mb={3} />
                  <Text color="gray.400" fontSize="md" fontWeight="500">
                    Nenhum aluno matriculado nesta turma
                  </Text>
                </Flex>
              ) : (
                <Box overflowX="auto">
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th color="gray.400" fontSize="xs" py={4} w="60px">
                          #
                        </Th>
                        <Th color="gray.400" fontSize="xs" py={4}>
                          Aluno
                        </Th>
                        <Th color="gray.400" fontSize="xs" py={4} display={{ base: 'none', md: 'table-cell' }}>
                          Telefone
                        </Th>
                        <Th color="gray.400" fontSize="xs" py={4} textAlign="center">
                          Presença
                        </Th>
                        <Th color="gray.400" fontSize="xs" py={4} textAlign="center">
                          Status
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {alunos.map((aluno, idx) => {
                        const presenca = presencas.find((p) => p.aluno_id === aluno.idaluno)
                        const presente = presenca?.presente ?? false

                        return (
                          <Tr
                            key={aluno.idaluno}
                            _hover={{ bg: 'gray.50' }}
                            transition="background 0.15s"
                            bg={presente ? 'green.50' : undefined}
                            cursor="pointer"
                            onClick={() => togglePresenca(aluno.idaluno)}
                          >
                            <Td py={3}>
                              <Text fontSize="sm" color="gray.400" fontWeight="500">
                                {idx + 1}
                              </Text>
                            </Td>
                            <Td py={3}>
                              <HStack spacing={3}>
                                <Avatar
                                  size="sm"
                                  name={aluno.nome}
                                  bg={presente ? 'green.100' : 'gray.200'}
                                  color={presente ? 'green.700' : 'gray.500'}
                                />
                                <Text fontSize="sm" fontWeight="600" color="gray.700">
                                  {aluno.nome}
                                </Text>
                              </HStack>
                            </Td>
                            <Td py={3} display={{ base: 'none', md: 'table-cell' }}>
                              <Text fontSize="sm" color="gray.600">
                                {aluno.telefone}
                              </Text>
                            </Td>
                            <Td py={3} textAlign="center">
                              <Checkbox
                                colorScheme="green"
                                size="lg"
                                isChecked={presente}
                                onChange={() => togglePresenca(aluno.idaluno)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </Td>
                            <Td py={3} textAlign="center">
                              <Badge
                                colorScheme={presente ? 'green' : 'red'}
                                rounded="full"
                                px={2.5}
                                py={0.5}
                                fontSize="xs"
                                fontWeight="600"
                              >
                                {presente ? 'Presente' : 'Falta'}
                              </Badge>
                            </Td>
                          </Tr>
                        )
                      })}
                    </Tbody>
                  </Table>
                </Box>
              )}

              {/* Footer */}
              {!loading && alunos.length > 0 && (
                <Flex px={6} py={3} borderTop="1px solid" borderColor="gray.50" justify="space-between" align="center">
                  <Text fontSize="xs" color="gray.400">
                    {totalPresentes} de {alunos.length} aluno{alunos.length !== 1 ? 's' : ''} presente{totalPresentes !== 1 ? 's' : ''}
                  </Text>
                  {selectedTurmaObj && (
                    <HStack spacing={2}>
                      <Tag size="sm" colorScheme="brand" variant="subtle" rounded="full">
                        {selectedTurmaObj.modalidade?.nome}
                      </Tag>
                      <Text fontSize="xs" color="gray.400">
                        {selectedTurmaObj.horario?.slice(0, 5)} • {selectedTurmaObj.dias_semana}
                      </Text>
                    </HStack>
                  )}
                </Flex>
              )}
            </Box>
          </>
        )}
      </Box>
    </AppLayout>
  )
}
