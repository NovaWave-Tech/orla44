import { useState, useEffect } from 'react'
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
  SimpleGrid,
  VStack,
  useToast,
  FormErrorMessage,
  NumberInput,
  NumberInputField,
} from '@chakra-ui/react'
import { supabase } from '../../lib/supabase'

export const CATEGORIAS_GASTO = [
  'Aluguel',
  'Energia',
  'Água',
  'Internet',
  'Material',
  'Equipamentos',
  'Salário',
  'Marketing',
  'Manutenção',
  'Outros',
] as const

export type CategoriaGasto = (typeof CATEGORIAS_GASTO)[number]

export interface GastoData {
  idgasto?: number
  descricao: string
  valor: number | ''
  categoria: CategoriaGasto | ''
  data: string
  observacao: string
}

const emptyGasto: GastoData = {
  descricao: '',
  valor: '',
  categoria: '',
  data: new Date().toISOString().slice(0, 10),
  observacao: '',
}

interface GastoFormModalProps {
  isOpen: boolean
  onClose: () => void
  gasto?: GastoData | null
  onSaved: () => void
}

export default function GastoFormModal({ isOpen, onClose, gasto, onSaved }: GastoFormModalProps) {
  const toast = useToast()
  const [form, setForm] = useState<GastoData>(emptyGasto)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditing = !!gasto?.idgasto

  useEffect(() => {
    if (isOpen) {
      setForm(gasto ? { ...gasto } : emptyGasto)
      setErrors({})
    }
  }, [isOpen, gasto])

  const handleChange = (field: keyof GastoData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!form.descricao.trim()) errs.descricao = 'Descrição é obrigatória'
    if (!form.valor || Number(form.valor) <= 0) errs.valor = 'Informe um valor válido'
    if (!form.categoria) errs.categoria = 'Selecione uma categoria'
    if (!form.data) errs.data = 'Informe a data'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const payload = {
        descricao: form.descricao.trim(),
        valor: Number(form.valor),
        categoria: form.categoria,
        data: form.data,
        observacao: form.observacao.trim() || null,
      }

      if (isEditing) {
        const { error } = await supabase.from('gasto').update(payload).eq('idgasto', gasto!.idgasto)
        if (error) throw error
        toast({ title: 'Gasto atualizado com sucesso', status: 'success', duration: 3000, position: 'top' })
      } else {
        const { error } = await supabase.from('gasto').insert(payload)
        if (error) throw error
        toast({ title: 'Gasto registrado com sucesso', status: 'success', duration: 3000, position: 'top' })
      }

      onSaved()
      onClose()
    } catch (err: any) {
      toast({ title: 'Erro ao salvar gasto', description: err.message, status: 'error', duration: 4000, position: 'top' })
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    rounded: 'xl',
    bg: 'gray.50',
    border: '1px solid',
    borderColor: 'gray.200',
    _focus: { bg: 'white', borderColor: 'brand.500' },
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <ModalContent rounded="2xl" mx={4}>
        <ModalHeader fontSize="lg" fontWeight="700" color="gray.800" pb={0}>
          {isEditing ? 'Editar Gasto' : 'Registrar Gasto'}
        </ModalHeader>
        <ModalCloseButton rounded="xl" />

        <ModalBody pt={4} pb={2}>
          <VStack spacing={4}>
            <FormControl isInvalid={!!errors.descricao} isRequired>
              <FormLabel fontSize="sm" fontWeight="600" color="gray.600">Descrição</FormLabel>
              <Input
                placeholder="Ex: Conta de energia elétrica"
                value={form.descricao}
                onChange={e => handleChange('descricao', e.target.value)}
                {...inputStyle}
              />
              <FormErrorMessage>{errors.descricao}</FormErrorMessage>
            </FormControl>

            <SimpleGrid columns={2} spacing={4} w="full">
              <FormControl isInvalid={!!errors.valor} isRequired>
                <FormLabel fontSize="sm" fontWeight="600" color="gray.600">Valor (R$)</FormLabel>
                <NumberInput
                  min={0}
                  step={0.01}
                  precision={2}
                  value={form.valor}
                  onChange={val => handleChange('valor', val ? Number(val) : '')}
                >
                  <NumberInputField placeholder="0,00" {...inputStyle} />
                </NumberInput>
                <FormErrorMessage>{errors.valor}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.data} isRequired>
                <FormLabel fontSize="sm" fontWeight="600" color="gray.600">Data</FormLabel>
                <Input
                  type="date"
                  value={form.data}
                  onChange={e => handleChange('data', e.target.value)}
                  {...inputStyle}
                />
                <FormErrorMessage>{errors.data}</FormErrorMessage>
              </FormControl>
            </SimpleGrid>

            <FormControl isInvalid={!!errors.categoria} isRequired>
              <FormLabel fontSize="sm" fontWeight="600" color="gray.600">Categoria</FormLabel>
              <Select
                placeholder="Selecione uma categoria"
                value={form.categoria}
                onChange={e => handleChange('categoria', e.target.value)}
                {...inputStyle}
              >
                {CATEGORIAS_GASTO.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
              <FormErrorMessage>{errors.categoria}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm" fontWeight="600" color="gray.600">Observações</FormLabel>
              <Textarea
                placeholder="Informações adicionais..."
                value={form.observacao}
                onChange={e => handleChange('observacao', e.target.value)}
                {...inputStyle}
                resize="vertical"
                rows={3}
              />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter gap={3} pt={2}>
          <Button variant="ghost" onClick={onClose} rounded="xl" color="gray.500">Cancelar</Button>
          <Button
            colorScheme="brand"
            onClick={handleSave}
            isLoading={saving}
            loadingText="Salvando..."
            rounded="xl"
            px={8}
          >
            {isEditing ? 'Salvar Alterações' : 'Registrar'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
