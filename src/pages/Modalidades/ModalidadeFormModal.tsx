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
  VStack,
  useToast,
  FormErrorMessage,
} from '@chakra-ui/react'
import { supabase } from '../../lib/supabase'

export interface ModalidadeData {
  idmodalidade?: number
  nome: string
  situacao: number
}

const emptyModalidade: ModalidadeData = {
  nome: '',
  situacao: 1,
}

interface ModalidadeFormModalProps {
  isOpen: boolean
  onClose: () => void
  modalidade?: ModalidadeData | null
  onSaved: () => void
}

export default function ModalidadeFormModal({
  isOpen,
  onClose,
  modalidade,
  onSaved,
}: ModalidadeFormModalProps) {
  const toast = useToast()
  const [form, setForm] = useState<ModalidadeData>(emptyModalidade)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditing = !!modalidade?.idmodalidade

  useEffect(() => {
    if (isOpen) {
      setForm(modalidade ? { ...modalidade } : emptyModalidade)
      setErrors({})
    }
  }, [isOpen, modalidade])

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!form.nome.trim()) errs.nome = 'Nome é obrigatório'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return

    setSaving(true)
    try {
      const payload = {
        nome: form.nome.trim(),
        situacao: form.situacao,
      }

      if (isEditing) {
        const { error } = await supabase
          .from('modalidade')
          .update(payload)
          .eq('idmodalidade', modalidade!.idmodalidade)
        if (error) throw error
        toast({ title: 'Modalidade atualizada com sucesso', status: 'success', duration: 3000 })
      } else {
        const { error } = await supabase.from('modalidade').insert(payload)
        if (error) throw error
        toast({ title: 'Modalidade cadastrada com sucesso', status: 'success', duration: 3000 })
      }

      onSaved()
      onClose()
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar modalidade',
        description: err.message ?? 'Tente novamente',
        status: 'error',
        duration: 4000,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <ModalContent rounded="2xl" mx={4}>
        <ModalHeader fontSize="lg" fontWeight="700" color="gray.800" pb={0}>
          {isEditing ? 'Editar Modalidade' : 'Nova Modalidade'}
        </ModalHeader>
        <ModalCloseButton rounded="xl" />

        <ModalBody pt={4} pb={2}>
          <VStack spacing={4}>
            <FormControl isInvalid={!!errors.nome} isRequired>
              <FormLabel fontSize="sm" fontWeight="600" color="gray.600">
                Nome
              </FormLabel>
              <Input
                placeholder="Ex: Beach Tennis, Futevôlei..."
                value={form.nome}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, nome: e.target.value }))
                  if (errors.nome) setErrors((prev) => ({ ...prev, nome: '' }))
                }}
                rounded="xl"
                bg="gray.50"
                border="1px solid"
                borderColor="gray.200"
                _focus={{ bg: 'white', borderColor: 'brand.500' }}
              />
              <FormErrorMessage>{errors.nome}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm" fontWeight="600" color="gray.600">
                Status
              </FormLabel>
              <Select
                value={form.situacao}
                onChange={(e) => setForm((prev) => ({ ...prev, situacao: Number(e.target.value) }))}
                rounded="xl"
                bg="gray.50"
                border="1px solid"
                borderColor="gray.200"
                _focus={{ bg: 'white', borderColor: 'brand.500' }}
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
            {isEditing ? 'Salvar Alterações' : 'Cadastrar'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
