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
  Textarea,
  Switch,
  SimpleGrid,
  VStack,
  useToast,
  FormErrorMessage,
} from '@chakra-ui/react'
import { supabase } from '../../lib/supabase'

interface Modalidade {
  idmodalidade: number
  nome: string
}

interface Turma {
  idturma: number
  nome: string
  modalidade_id: number
}

export interface AlunoData {
  idaluno?: number
  nome: string
  telefone: string
  modalidade_id: number | ''
  turma_id: number | '' | null
  data_inicio: string
  dia_vencimento: number | ''
  notificacao_whatsapp: number
  situacao: number
  observacao: string
}

const emptyAluno: AlunoData = {
  nome: '',
  telefone: '',
  modalidade_id: '',
  turma_id: '',
  data_inicio: new Date().toISOString().slice(0, 10),
  dia_vencimento: '',
  notificacao_whatsapp: 1,
  situacao: 1,
  observacao: '',
}

interface AlunoFormModalProps {
  isOpen: boolean
  onClose: () => void
  aluno?: AlunoData | null
  onSaved: () => void
}

export default function AlunoFormModal({ isOpen, onClose, aluno, onSaved }: AlunoFormModalProps) {
  const toast = useToast()
  const [form, setForm] = useState<AlunoData>(emptyAluno)
  const [modalidades, setModalidades] = useState<Modalidade[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [turmasFiltradas, setTurmasFiltradas] = useState<Turma[]>([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditing = !!aluno?.idaluno

  useEffect(() => {
    if (isOpen) {
      loadSelects()
      if (aluno) {
        setForm({
          ...aluno,
          turma_id: aluno.turma_id ?? '',
          data_inicio: aluno.data_inicio ?? new Date().toISOString().slice(0, 10),
          observacao: aluno.observacao ?? '',
        })
      } else {
        setForm(emptyAluno)
      }
      setErrors({})
    }
  }, [isOpen, aluno])

  // Filter turmas when modalidade changes
  useEffect(() => {
    if (form.modalidade_id) {
      setTurmasFiltradas(turmas.filter((t) => t.modalidade_id === Number(form.modalidade_id)))
    } else {
      setTurmasFiltradas([])
    }
  }, [form.modalidade_id, turmas])

  const loadSelects = async () => {
    const [{ data: mods }, { data: trs }] = await Promise.all([
      supabase.from('modalidade').select('idmodalidade, nome').eq('situacao', 1).order('nome'),
      supabase.from('turma').select('idturma, nome, modalidade_id').eq('situacao', 1).order('nome'),
    ])
    setModalidades(mods ?? [])
    setTurmas(trs ?? [])
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!form.nome.trim()) errs.nome = 'Nome é obrigatório'
    if (!form.telefone.trim()) errs.telefone = 'Telefone é obrigatório'
    if (!form.modalidade_id) errs.modalidade_id = 'Selecione uma modalidade'
    if (!form.dia_vencimento || Number(form.dia_vencimento) < 1 || Number(form.dia_vencimento) > 31) {
      errs.dia_vencimento = 'Dia de vencimento inválido (1-31)'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleChange = (field: keyof AlunoData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const handleSave = async () => {
    if (!validate()) return

    setSaving(true)
    try {
      const payload = {
        nome: form.nome.trim(),
        telefone: form.telefone.trim(),
        modalidade_id: Number(form.modalidade_id),
        turma_id: form.turma_id ? Number(form.turma_id) : null,
        data_inicio: form.data_inicio || null,
        dia_vencimento: Number(form.dia_vencimento),
        notificacao_whatsapp: form.notificacao_whatsapp,
        situacao: form.situacao,
        observacao: form.observacao.trim() || null,
      }

      if (isEditing) {
        const { error } = await supabase
          .from('aluno')
          .update(payload)
          .eq('idaluno', aluno!.idaluno)
        if (error) throw error
        toast({ title: 'Aluno atualizado com sucesso', status: 'success', duration: 3000 })
      } else {
        const { error } = await supabase.from('aluno').insert(payload)
        if (error) throw error
        toast({ title: 'Aluno cadastrado com sucesso', status: 'success', duration: 3000 })
      }

      onSaved()
      onClose()
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar aluno',
        description: err.message ?? 'Tente novamente',
        status: 'error',
        duration: 4000,
      })
    } finally {
      setSaving(false)
    }
  }

  // Format phone as user types: (XX) XXXXX-XXXX
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 2) return digits
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <ModalContent rounded="2xl" mx={4}>
        <ModalHeader fontSize="lg" fontWeight="700" color="gray.800" pb={0}>
          {isEditing ? 'Editar Aluno' : 'Novo Aluno'}
        </ModalHeader>
        <ModalCloseButton rounded="xl" />

        <ModalBody pt={4} pb={2}>
          <VStack spacing={4}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
              <FormControl isInvalid={!!errors.nome} isRequired>
                <FormLabel fontSize="sm" fontWeight="600" color="gray.600">
                  Nome
                </FormLabel>
                <Input
                  placeholder="Nome completo"
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

              <FormControl isInvalid={!!errors.telefone} isRequired>
                <FormLabel fontSize="sm" fontWeight="600" color="gray.600">
                  Telefone
                </FormLabel>
                <Input
                  placeholder="(00) 00000-0000"
                  value={form.telefone}
                  onChange={(e) => handleChange('telefone', formatPhone(e.target.value))}
                  rounded="xl"
                  bg="gray.50"
                  border="1px solid"
                  borderColor="gray.200"
                  _focus={{ bg: 'white', borderColor: 'brand.500' }}
                />
                <FormErrorMessage>{errors.telefone}</FormErrorMessage>
              </FormControl>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
              <FormControl isInvalid={!!errors.modalidade_id} isRequired>
                <FormLabel fontSize="sm" fontWeight="600" color="gray.600">
                  Modalidade
                </FormLabel>
                <Select
                  placeholder="Selecione"
                  value={form.modalidade_id}
                  onChange={(e) => {
                    handleChange('modalidade_id', e.target.value ? Number(e.target.value) : '')
                    handleChange('turma_id', '')
                  }}
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

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="600" color="gray.600">
                  Turma
                </FormLabel>
                <Select
                  placeholder={turmasFiltradas.length ? 'Selecione' : 'Selecione a modalidade primeiro'}
                  value={form.turma_id ?? ''}
                  onChange={(e) => handleChange('turma_id', e.target.value ? Number(e.target.value) : null)}
                  rounded="xl"
                  bg="gray.50"
                  border="1px solid"
                  borderColor="gray.200"
                  _focus={{ bg: 'white', borderColor: 'brand.500' }}
                  isDisabled={!form.modalidade_id}
                >
                  {turmasFiltradas.map((t) => (
                    <option key={t.idturma} value={t.idturma}>
                      {t.nome}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="full">
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="600" color="gray.600">
                  Data de Início
                </FormLabel>
                <Input
                  type="date"
                  value={form.data_inicio}
                  onChange={(e) => handleChange('data_inicio', e.target.value)}
                  rounded="xl"
                  bg="gray.50"
                  border="1px solid"
                  borderColor="gray.200"
                  _focus={{ bg: 'white', borderColor: 'brand.500' }}
                />
              </FormControl>

              <FormControl isInvalid={!!errors.dia_vencimento} isRequired>
                <FormLabel fontSize="sm" fontWeight="600" color="gray.600">
                  Dia do Vencimento
                </FormLabel>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  placeholder="Ex: 10"
                  value={form.dia_vencimento}
                  onChange={(e) => handleChange('dia_vencimento', e.target.value ? Number(e.target.value) : '')}
                  rounded="xl"
                  bg="gray.50"
                  border="1px solid"
                  borderColor="gray.200"
                  _focus={{ bg: 'white', borderColor: 'brand.500' }}
                />
                <FormErrorMessage>{errors.dia_vencimento}</FormErrorMessage>
              </FormControl>

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
                >
                  <option value={1}>Ativo</option>
                  <option value={0}>Inativo</option>
                </Select>
              </FormControl>
            </SimpleGrid>

            <FormControl display="flex" alignItems="center" justifyContent="space-between" px={1}>
              <FormLabel fontSize="sm" fontWeight="600" color="gray.600" mb={0}>
                Notificações via WhatsApp
              </FormLabel>
              <Switch
                colorScheme="brand"
                size="md"
                isChecked={form.notificacao_whatsapp === 1}
                onChange={(e) => handleChange('notificacao_whatsapp', e.target.checked ? 1 : 0)}
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm" fontWeight="600" color="gray.600">
                Observações
              </FormLabel>
              <Textarea
                placeholder="Observações sobre o aluno..."
                value={form.observacao}
                onChange={(e) => handleChange('observacao', e.target.value)}
                rounded="xl"
                bg="gray.50"
                border="1px solid"
                borderColor="gray.200"
                _focus={{ bg: 'white', borderColor: 'brand.500' }}
                resize="vertical"
                rows={3}
              />
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
            {isEditing ? 'Salvar Alterações' : 'Cadastrar'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
