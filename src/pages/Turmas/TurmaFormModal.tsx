import { useEffect, useState } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  SimpleGrid,
  VStack,
  useToast,
  FormErrorMessage,
  CheckboxGroup,
  Checkbox,
  Wrap,
  WrapItem,
} from '@chakra-ui/react'
import { supabase } from '../../lib/supabase'

interface Modalidade {
  idmodalidade: number
  nome: string
}

export interface TurmaData {
  idturma?: number
  nome: string
  modalidade_id: number | ''
  dias_semana: string
  horario: string
  professor: string
  limite_alunos: number | ''
  situacao: number
}

const emptyTurma: TurmaData = {
  nome: '',
  modalidade_id: '',
  dias_semana: '',
  horario: '',
  professor: '',
  limite_alunos: '',
  situacao: 1,
}

const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

interface TurmaFormModalProps {
  isOpen: boolean
  onClose: () => void
  turma?: TurmaData | null
  onSaved: () => void
}

export default function TurmaFormModal({ isOpen, onClose, turma, onSaved }: TurmaFormModalProps) {
  const toast = useToast()
  const [form, setForm] = useState<TurmaData>(emptyTurma)
  const [modalidades, setModalidades] = useState<Modalidade[]>([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>([])

  const isEditing = !!turma?.idturma

  useEffect(() => {
    if (isOpen) {
      loadModalidades()
      if (turma) {
        setForm({ ...turma })
        setDiasSelecionados(turma.dias_semana ? turma.dias_semana.split(', ') : [])
      } else {
        setForm(emptyTurma)
        setDiasSelecionados([])
      }
      setErrors({})
    }
  }, [isOpen, turma])

  const loadModalidades = async () => {
    const { data } = await supabase.from('modalidade').select('idmodalidade, nome').eq('situacao', 1).order('nome')
    setModalidades(data ?? [])
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!form.nome.trim()) errs.nome = 'Nome é obrigatório'
    if (!form.modalidade_id) errs.modalidade_id = 'Selecione uma modalidade'
    if (diasSelecionados.length === 0) errs.dias_semana = 'Selecione pelo menos um dia'
    if (!form.horario) errs.horario = 'Horário é obrigatório'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleChange = (field: keyof TurmaData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const handleSave = async () => {
    if (!validate()) return

    setSaving(true)
    try {
      const payload = {
        nome: form.nome.trim(),
        modalidade_id: Number(form.modalidade_id),
        dias_semana: diasSelecionados.join(', '),
        horario: form.horario,
        professor: form.professor.trim() || null,
        limite_alunos: form.limite_alunos ? Number(form.limite_alunos) : null,
        situacao: form.situacao,
      }

      if (isEditing) {
        const { error } = await supabase
          .from('turma')
          .update(payload)
          .eq('idturma', turma!.idturma)
        if (error) throw error
        toast({ title: 'Turma atualizada com sucesso', status: 'success', duration: 3000 })
      } else {
        const { error } = await supabase.from('turma').insert(payload)
        if (error) throw error
        toast({ title: 'Turma criada com sucesso', status: 'success', duration: 3000 })
      }

      onSaved()
      onClose()
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar turma',
        description: err.message ?? 'Tente novamente',
        status: 'error',
        duration: 4000,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <ModalContent rounded="2xl" mx={4}>
        <ModalHeader fontSize="lg" fontWeight="700" color="gray.800" pb={0}>
          {isEditing ? 'Editar Turma' : 'Nova Turma'}
        </ModalHeader>
        <ModalCloseButton rounded="xl" />

        <ModalBody pt={4} pb={2}>
          <VStack spacing={4}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
              <FormControl isInvalid={!!errors.nome} isRequired>
                <FormLabel fontSize="sm" fontWeight="600" color="gray.600">
                  Nome da Turma
                </FormLabel>
                <Input
                  placeholder="Ex: Turma A - Manhã"
                  value={form.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                  rounded="xl"
                  bg="gray.50"
                  border="1px solid"
                  borderColor="gray.200"
                  _focus={{ bg: 'white', borderColor: 'brand.500' }}
                />
                <FormErrorMessage>{errors.nome}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.modalidade_id} isRequired>
                <FormLabel fontSize="sm" fontWeight="600" color="gray.600">
                  Modalidade
                </FormLabel>
                <Select
                  placeholder="Selecione"
                  value={form.modalidade_id}
                  onChange={(e) => handleChange('modalidade_id', e.target.value ? Number(e.target.value) : '')}
                  rounded="xl"
                  bg="gray.50"
                  border="1px solid"
                  borderColor="gray.200"
                  _focus={{ bg: 'white', borderColor: 'brand.500' }}
                >
                  {modalidades.map((m) => (
                    <option key={m.idmodalidade} value={m.idmodalidade}>
                      {m.nome}
                    </option>
                  ))}
                </Select>
                <FormErrorMessage>{errors.modalidade_id}</FormErrorMessage>
              </FormControl>
            </SimpleGrid>

            <FormControl isInvalid={!!errors.dias_semana} isRequired>
              <FormLabel fontSize="sm" fontWeight="600" color="gray.600">
                Dias da Semana
              </FormLabel>
              <CheckboxGroup
                value={diasSelecionados}
                onChange={(vals) => {
                  setDiasSelecionados(vals as string[])
                  if (errors.dias_semana) setErrors((prev) => ({ ...prev, dias_semana: '' }))
                }}
              >
                <Wrap spacing={3}>
                  {DIAS.map((dia) => (
                    <WrapItem key={dia}>
                      <Checkbox value={dia} colorScheme="brand" rounded="lg">
                        {dia}
                      </Checkbox>
                    </WrapItem>
                  ))}
                </Wrap>
              </CheckboxGroup>
              <FormErrorMessage>{errors.dias_semana}</FormErrorMessage>
            </FormControl>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="full">
              <FormControl isInvalid={!!errors.horario} isRequired>
                <FormLabel fontSize="sm" fontWeight="600" color="gray.600">
                  Horário
                </FormLabel>
                <Input
                  type="time"
                  value={form.horario}
                  onChange={(e) => handleChange('horario', e.target.value)}
                  rounded="xl"
                  bg="gray.50"
                  border="1px solid"
                  borderColor="gray.200"
                  _focus={{ bg: 'white', borderColor: 'brand.500' }}
                />
                <FormErrorMessage>{errors.horario}</FormErrorMessage>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="600" color="gray.600">
                  Professor
                </FormLabel>
                <Input
                  placeholder="Nome do professor"
                  value={form.professor}
                  onChange={(e) => handleChange('professor', e.target.value)}
                  rounded="xl"
                  bg="gray.50"
                  border="1px solid"
                  borderColor="gray.200"
                  _focus={{ bg: 'white', borderColor: 'brand.500' }}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="600" color="gray.600">
                  Limite de Alunos
                </FormLabel>
                <Input
                  type="number"
                  min={1}
                  placeholder="Sem limite"
                  value={form.limite_alunos}
                  onChange={(e) => handleChange('limite_alunos', e.target.value ? Number(e.target.value) : '')}
                  rounded="xl"
                  bg="gray.50"
                  border="1px solid"
                  borderColor="gray.200"
                  _focus={{ bg: 'white', borderColor: 'brand.500' }}
                />
              </FormControl>
            </SimpleGrid>

            <FormControl>
              <FormLabel fontSize="sm" fontWeight="600" color="gray.600">
                Status
              </FormLabel>
              <Select
                value={form.situacao}
                onChange={(e) => handleChange('situacao', Number(e.target.value))}
                rounded="xl"
                bg="gray.50"
                border="1px solid"
                borderColor="gray.200"
                _focus={{ bg: 'white', borderColor: 'brand.500' }}
                maxW="200px"
              >
                <option value={1}>Ativa</option>
                <option value={0}>Inativa</option>
              </Select>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter gap={3} pt={2}>
          <Button variant="ghost" onClick={onClose} rounded="xl" color="gray.500">
            Cancelar
          </Button>
          <Button
            colorScheme="brand"
            onClick={handleSave}
            isLoading={saving}
            loadingText="Salvando..."
            rounded="xl"
            px={8}
          >
            {isEditing ? 'Salvar Alterações' : 'Criar Turma'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
