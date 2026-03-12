import { useEffect, useState, useCallback } from 'react'
import {
  Box,
  Flex,
  Text,
  HStack,
  VStack,
  Icon,
  Input,
  Select,
  Button,
  Textarea,
  Tag,
  Avatar,
  Wrap,
  WrapItem,
  Tooltip,
  IconButton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Badge,
} from '@chakra-ui/react'
import {
  FiSend,
  FiUsers,
  FiUser,
  FiGrid,
  FiLayers,
  FiClock,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiExternalLink,
  FiLink,
  FiMessageSquare,
} from 'react-icons/fi'
import { useRef } from 'react'
import { supabase } from '../../lib/supabase'
import AppLayout from '../../components/AppLayout'

interface AlunoRow {
  idaluno: number
  nome: string
  telefone: string
  modalidade_id: number
  turma_id: number | null
  situacao: number
  modalidade?: { nome: string } | { nome: string }[]
  turma?: { nome: string } | { nome: string }[]
}

interface TurmaRow {
  idturma: number
  nome: string
  modalidade_id: number
  modalidade?: { nome: string } | { nome: string }[]
}

interface ModalidadeRow {
  idmodalidade: number
  nome: string
}

interface GrupoWhatsApp {
  id: number
  nome: string
  link: string
  tipo: 'turma' | 'modalidade' | 'geral'
  referencia_id: number | null
}

interface MensagemLog {
  idmensagem: number
  tipo: string
  destino: string | null
  mensagem: string
  enviado_em: string
}

function normalizeTelefone(tel: string): string {
  const digits = tel.replace(/\D/g, '')
  return digits.startsWith('55') ? digits : `55${digits}`
}

function openWhatsApp(phone: string, message: string) {
  window.open(`https://wa.me/${normalizeTelefone(phone)}?text=${encodeURIComponent(message)}`, '_blank')
}

function openGrupoLink(link: string) {
  const url = link.startsWith('http') ? link : `https://chat.whatsapp.com/${link}`
  window.open(url, '_blank')
}

type TipoEnvio = 'aluno' | 'turma' | 'modalidade' | 'todos' | 'grupo'

export default function MensagensPage() {
  const toast = useToast()

  const [alunos, setAlunos] = useState<AlunoRow[]>([])
  const [turmas, setTurmas] = useState<TurmaRow[]>([])
  const [modalidades, setModalidades] = useState<ModalidadeRow[]>([])
  const [grupos, setGrupos] = useState<GrupoWhatsApp[]>([])
  const [historico, setHistorico] = useState<MensagemLog[]>([])
  const [sending, setSending] = useState(false)

  const [tipoEnvio, setTipoEnvio] = useState<TipoEnvio>('aluno')
  const [selectedAlunoId, setSelectedAlunoId] = useState('')
  const [selectedTurmaId, setSelectedTurmaId] = useState('')
  const [selectedModalidadeId, setSelectedModalidadeId] = useState('')
  const [selectedGrupoId, setSelectedGrupoId] = useState('')
  const [mensagem, setMensagem] = useState('')

  const { isOpen: isGrupoOpen, onOpen: onGrupoOpen, onClose: onGrupoClose } = useDisclosure()
  const [grupoForm, setGrupoForm] = useState({ nome: '', link: '', tipo: 'geral' as 'turma' | 'modalidade' | 'geral', referencia_id: '' })
  const [editingGrupo, setEditingGrupo] = useState<GrupoWhatsApp | null>(null)

  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
  const [deletingGrupo, setDeletingGrupo] = useState<GrupoWhatsApp | null>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => { loadAll() }, [])

  const loadAll = useCallback(async () => {
    try {
      const [alunosRes, turmasRes, modsRes, gruposRes, histRes] = await Promise.all([
        supabase.from('aluno').select('idaluno, nome, telefone, modalidade_id, turma_id, situacao, modalidade:modalidade_id(nome), turma:turma_id(nome)').eq('situacao', 1).order('nome'),
        supabase.from('turma').select('idturma, nome, modalidade_id, modalidade:modalidade_id(nome)').eq('situacao', 1).order('nome'),
        supabase.from('modalidade').select('idmodalidade, nome').eq('situacao', 1).order('nome'),
        supabase.from('grupo_whatsapp').select('*').order('nome'),
        supabase.from('mensagem').select('*').order('enviado_em', { ascending: false }).limit(50),
      ])
      setAlunos((alunosRes.data as any) ?? [])
      setTurmas((turmasRes.data as any) ?? [])
      setModalidades(modsRes.data ?? [])
      setGrupos((gruposRes.data as any) ?? [])
      setHistorico((histRes.data as any) ?? [])
    } catch (err: any) {
      toast({ title: 'Erro ao carregar dados', description: err.message, status: 'error', duration: 4000 })
    }
  }, [toast])

  function getDestinatarios(): AlunoRow[] {
    switch (tipoEnvio) {
      case 'aluno': return alunos.filter((a) => a.idaluno === Number(selectedAlunoId))
      case 'turma': return alunos.filter((a) => a.turma_id === Number(selectedTurmaId))
      case 'modalidade': return alunos.filter((a) => a.modalidade_id === Number(selectedModalidadeId))
      case 'todos': return alunos
      default: return []
    }
  }

  function getDestinoLabel(): string {
    switch (tipoEnvio) {
      case 'aluno': return alunos.find((a) => a.idaluno === Number(selectedAlunoId))?.nome ?? ''
      case 'turma': { const t = turmas.find((t) => t.idturma === Number(selectedTurmaId)); return t ? `Turma: ${t.nome}` : '' }
      case 'modalidade': { const m = modalidades.find((m) => m.idmodalidade === Number(selectedModalidadeId)); return m ? `Modalidade: ${m.nome}` : '' }
      case 'todos': return 'Todos os alunos'
      case 'grupo': { const g = grupos.find((g) => g.id === Number(selectedGrupoId)); return g ? `Grupo: ${g.nome}` : '' }
      default: return ''
    }
  }

  const handleSend = async () => {
    if (!mensagem.trim()) {
      toast({ title: 'Digite uma mensagem', status: 'warning', duration: 3000 }); return
    }
    if (tipoEnvio === 'grupo') {
      const grupo = grupos.find((g) => g.id === Number(selectedGrupoId))
      if (!grupo) { toast({ title: 'Selecione um grupo', status: 'warning', duration: 3000 }); return }
      setSending(true)
      openGrupoLink(grupo.link)
      try { await navigator.clipboard.writeText(mensagem) } catch { /* silent */ }
      toast({ title: 'Grupo aberto!', description: 'Mensagem copiada para a area de transferencia. Cole no grupo.', status: 'info', duration: 6000 })
      await supabase.from('mensagem').insert({ tipo: 'grupo', destino: grupo.nome, mensagem })
      await loadAll(); setMensagem(''); setSending(false); return
    }
    const destinatarios = getDestinatarios()
    if (destinatarios.length === 0) {
      toast({ title: 'Selecione um destinatario', status: 'warning', duration: 3000 }); return
    }
    setSending(true)
    const MAX = 10
    if (destinatarios.length > MAX)
      toast({ title: `${destinatarios.length} alunos`, description: `Somente as primeiras ${MAX} abas serao abertas. Use um Grupo para envios em massa.`, status: 'warning', duration: 8000 })
    destinatarios.slice(0, MAX).forEach((a, i) => setTimeout(() => openWhatsApp(a.telefone, mensagem), i * 600))
    await supabase.from('mensagem').insert({ tipo: tipoEnvio, destino: getDestinoLabel(), mensagem })
    toast({ title: 'Enviando!', description: `${Math.min(destinatarios.length, MAX)} conversa(s) abertas no WhatsApp.`, status: 'success', duration: 5000 })
    await loadAll(); setMensagem(''); setSending(false)
  }

  const handleNewGrupo = () => {
    setEditingGrupo(null)
    setGrupoForm({ nome: '', link: '', tipo: 'geral', referencia_id: '' })
    onGrupoOpen()
  }

  const handleEditGrupo = (g: GrupoWhatsApp) => {
    setEditingGrupo(g)
    setGrupoForm({ nome: g.nome, link: g.link, tipo: g.tipo, referencia_id: g.referencia_id?.toString() ?? '' })
    onGrupoOpen()
  }

  const handleSaveGrupo = async () => {
    if (!grupoForm.nome.trim() || !grupoForm.link.trim()) {
      toast({ title: 'Preencha nome e link do grupo', status: 'warning', duration: 3000 }); return
    }
    const payload = { nome: grupoForm.nome, link: grupoForm.link, tipo: grupoForm.tipo, referencia_id: grupoForm.referencia_id ? Number(grupoForm.referencia_id) : null }
    try {
      if (editingGrupo) {
        const { error } = await supabase.from('grupo_whatsapp').update(payload).eq('id', editingGrupo.id)
        if (error) throw error
        toast({ title: 'Grupo atualizado!', status: 'success', duration: 3000 })
      } else {
        const { error } = await supabase.from('grupo_whatsapp').insert(payload)
        if (error) throw error
        toast({ title: 'Grupo cadastrado!', status: 'success', duration: 3000 })
      }
      onGrupoClose(); await loadAll()
    } catch (err: any) {
      toast({ title: 'Erro ao salvar grupo', description: err.message, status: 'error', duration: 4000 })
    }
  }

  const confirmDeleteGrupo = async () => {
    if (!deletingGrupo) return
    try {
      const { error } = await supabase.from('grupo_whatsapp').delete().eq('id', deletingGrupo.id)
      if (error) throw error
      toast({ title: 'Grupo removido', status: 'success', duration: 3000 })
      onDeleteClose(); await loadAll()
    } catch (err: any) {
      toast({ title: 'Erro ao remover grupo', description: err.message, status: 'error', duration: 4000 })
    }
  }

  const destinatarios = tipoEnvio !== 'grupo' ? getDestinatarios() : []
  const canSend = mensagem.trim().length > 0 && (
    tipoEnvio === 'todos' ||
    (tipoEnvio === 'aluno' && !!selectedAlunoId) ||
    (tipoEnvio === 'turma' && !!selectedTurmaId) ||
    (tipoEnvio === 'modalidade' && !!selectedModalidadeId) ||
    (tipoEnvio === 'grupo' && !!selectedGrupoId)
  )

  const inputStyle = {
    bg: 'white',
    border: '1px solid',
    borderColor: 'gray.200',
    color: 'gray.800',
    _placeholder: { color: 'gray.400' },
    _hover: { borderColor: 'gray.300' },
    _focus: { borderColor: 'brand.400', boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)' },
  }

  return (
    <AppLayout>
      <Box p={{ base: 4, md: 6, lg: 8 }} maxW="1400px" w="full" mx="auto">

        <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={3}>
          <Box>
            <Text fontSize="2xl" fontWeight="700" color="gray.800">Central de Mensagens</Text>
            <Text fontSize="sm" color="gray.500">Envie mensagens via WhatsApp para alunos, turmas ou modalidades</Text>
          </Box>
        </Flex>

        <Flex gap={6} direction={{ base: 'column', xl: 'row' }} align="start">

          {/* Compose */}
          <Box flex={1} bg="white" rounded="2xl" border="1px solid" borderColor="gray.100" shadow="sm" p={6}>
            <HStack mb={5}>
              <Flex w={9} h={9} rounded="xl" bg="brand.50" align="center" justify="center">
                <Icon as={FiMessageSquare} boxSize={5} color="brand.600" />
              </Flex>
              <Text fontSize="md" fontWeight="700" color="gray.700">Compor mensagem</Text>
            </HStack>

            <Text fontSize="xs" fontWeight="600" color="gray.500" textTransform="uppercase" letterSpacing="wide" mb={2}>Enviar para</Text>
            <Wrap spacing={2} mb={5}>
              {([
                { value: 'aluno', label: 'Aluno', icon: FiUser },
                { value: 'turma', label: 'Turma', icon: FiLayers },
                { value: 'modalidade', label: 'Modalidade', icon: FiGrid },
                { value: 'todos', label: 'Todos os alunos', icon: FiUsers },
                { value: 'grupo', label: 'Grupo WhatsApp', icon: FiLink },
              ] as { value: TipoEnvio; label: string; icon: React.ElementType }[]).map((opt) => {
                const active = tipoEnvio === opt.value
                return (
                  <WrapItem key={opt.value}>
                    <Button
                      size="sm"
                      variant={active ? 'solid' : 'outline'}
                      colorScheme={active ? 'green' : 'gray'}
                      leftIcon={<Icon as={opt.icon} />}
                      onClick={() => { setTipoEnvio(opt.value); setSelectedAlunoId(''); setSelectedTurmaId(''); setSelectedModalidadeId(''); setSelectedGrupoId('') }}
                      rounded="lg"
                      fontWeight={active ? '600' : '400'}
                    >
                      {opt.label}
                    </Button>
                  </WrapItem>
                )
              })}
            </Wrap>

            {tipoEnvio === 'aluno' && (
              <FormControl mb={4}>
                <FormLabel fontSize="sm" color="gray.600" fontWeight="600">Selecione o aluno</FormLabel>
                <Select placeholder=" Selecione " value={selectedAlunoId} onChange={(e) => setSelectedAlunoId(e.target.value)} {...inputStyle}>
                  {alunos.map((a) => <option key={a.idaluno} value={a.idaluno}>{a.nome}  {a.telefone}</option>)}
                </Select>
              </FormControl>
            )}
            {tipoEnvio === 'turma' && (
              <FormControl mb={4}>
                <FormLabel fontSize="sm" color="gray.600" fontWeight="600">Selecione a turma</FormLabel>
                <Select placeholder=" Selecione " value={selectedTurmaId} onChange={(e) => setSelectedTurmaId(e.target.value)} {...inputStyle}>
                  {turmas.map((t) => <option key={t.idturma} value={t.idturma}>{t.nome}</option>)}
                </Select>
              </FormControl>
            )}
            {tipoEnvio === 'modalidade' && (
              <FormControl mb={4}>
                <FormLabel fontSize="sm" color="gray.600" fontWeight="600">Selecione a modalidade</FormLabel>
                <Select placeholder=" Selecione " value={selectedModalidadeId} onChange={(e) => setSelectedModalidadeId(e.target.value)} {...inputStyle}>
                  {modalidades.map((m) => <option key={m.idmodalidade} value={m.idmodalidade}>{m.nome}</option>)}
                </Select>
              </FormControl>
            )}
            {tipoEnvio === 'grupo' && (
              <FormControl mb={4}>
                <FormLabel fontSize="sm" color="gray.600" fontWeight="600">Selecione o grupo</FormLabel>
                <HStack>
                  <Select placeholder=" Selecione " value={selectedGrupoId} onChange={(e) => setSelectedGrupoId(e.target.value)} flex={1} {...inputStyle}>
                    {grupos.map((g) => <option key={g.id} value={g.id}>{g.nome}</option>)}
                  </Select>
                  <Tooltip label="Adicionar grupo">
                    <IconButton aria-label="Novo grupo" icon={<FiPlus />} colorScheme="green" variant="outline" rounded="lg" onClick={handleNewGrupo} />
                  </Tooltip>
                </HStack>
              </FormControl>
            )}
            {tipoEnvio === 'todos' && (
              <Flex mb={4} p={3} rounded="xl" align="center" gap={3} bg="green.50" border="1px solid" borderColor="green.200">
                <Icon as={FiUsers} color="green.500" boxSize={5} />
                <Text fontSize="sm" color="green.700">Mensagem para <b>{alunos.length}</b> aluno(s) ativo(s).</Text>
              </Flex>
            )}

            {tipoEnvio !== 'todos' && tipoEnvio !== 'grupo' && destinatarios.length > 0 && (
              <Box mb={4} p={3} rounded="xl" bg="gray.50" border="1px solid" borderColor="gray.200" maxH="110px" overflowY="auto">
                <Text fontSize="xs" color="gray.500" mb={2} fontWeight="600">{destinatarios.length} destinatario(s)</Text>
                <Wrap spacing={2}>
                  {destinatarios.map((d) => (
                    <WrapItem key={d.idaluno}>
                      <Tag size="sm" rounded="full" bg="brand.50" color="brand.700" border="1px solid" borderColor="brand.100">
                        <Avatar size="2xs" name={d.nome} mr={1} />{d.nome}
                      </Tag>
                    </WrapItem>
                  ))}
                </Wrap>
              </Box>
            )}

            <FormControl mb={4}>
              <FormLabel fontSize="sm" color="gray.600" fontWeight="600">Mensagem</FormLabel>
              <Textarea
                placeholder={'Digite sua mensagem...\n\nEx: Atencao turma de Beach Tennis!\nO treino de amanha sera as 18h.'}
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                rows={6}
                {...inputStyle}
                rounded="xl"
                resize="vertical"
              />
              <Text fontSize="xs" color="gray.400" mt={1}>{mensagem.length} caracteres</Text>
            </FormControl>

            <Button
              colorScheme="green" size="lg" w="full" leftIcon={<Icon as={FiSend} />}
              onClick={handleSend} isLoading={sending} loadingText="Enviando..."
              isDisabled={!canSend} rounded="xl" fontWeight="700"
              _hover={{ transform: 'translateY(-1px)', shadow: 'md' }} transition="all 0.2s"
            >
              {tipoEnvio === 'grupo' ? 'Abrir Grupo e Copiar Mensagem' : 'Enviar via WhatsApp'}
            </Button>

            {tipoEnvio !== 'grupo' && destinatarios.length > 10 && (
              <Flex mt={3} p={3} rounded="lg" bg="orange.50" border="1px solid" borderColor="orange.200" align="center" gap={2}>
                <Text fontSize="xs" color="orange.700">Muitos destinatarios  use um Grupo WhatsApp para envios em massa.</Text>
              </Flex>
            )}
          </Box>

          {/* Sidebar */}
          <Box w={{ base: 'full', xl: '380px' }} flexShrink={0}>

            <Box bg="white" rounded="2xl" border="1px solid" borderColor="gray.100" shadow="sm" p={5} mb={5}>
              <Flex justify="space-between" align="center" mb={4}>
                <HStack>
                  <Flex w={8} h={8} rounded="lg" bg="green.50" align="center" justify="center">
                    <Icon as={FiLink} boxSize={4} color="green.600" />
                  </Flex>
                  <Text fontSize="sm" fontWeight="700" color="gray.700">Grupos WhatsApp</Text>
                </HStack>
                <Button size="xs" leftIcon={<FiPlus />} colorScheme="green" variant="ghost" onClick={handleNewGrupo} rounded="lg">Adicionar</Button>
              </Flex>

              {grupos.length === 0 ? (
                <Box textAlign="center" py={6} px={4}>
                  <Flex w={12} h={12} rounded="2xl" bg="gray.50" align="center" justify="center" mx="auto" mb={3}>
                    <Icon as={FiLink} boxSize={5} color="gray.400" />
                  </Flex>
                  <Text fontSize="sm" color="gray.500" fontWeight="600">Nenhum grupo cadastrado</Text>
                  <Text fontSize="xs" color="gray.400" mt={1}>Adicione links de grupos do WhatsApp para facilitar envios em massa.</Text>
                </Box>
              ) : (
                <VStack spacing={2} align="stretch">
                  {grupos.map((g) => (
                    <Flex key={g.id} p={3} rounded="xl" bg="gray.50" border="1px solid" borderColor="gray.100" align="center" justify="space-between" _hover={{ bg: 'gray.100' }} transition="all 0.15s">
                      <Box flex={1} minW={0}>
                        <Text fontSize="sm" fontWeight="600" color="gray.800" isTruncated>{g.nome}</Text>
                        <Badge mt={1} colorScheme={g.tipo === 'turma' ? 'blue' : g.tipo === 'modalidade' ? 'purple' : 'green'} rounded="full" fontSize="2xs" px={2}>
                          {g.tipo === 'turma' ? 'Turma' : g.tipo === 'modalidade' ? 'Modalidade' : 'Geral'}
                        </Badge>
                      </Box>
                      <HStack spacing={0}>
                        <Tooltip label="Abrir grupo"><IconButton aria-label="Abrir" icon={<FiExternalLink />} size="sm" variant="ghost" color="gray.400" _hover={{ color: 'green.500' }} onClick={() => openGrupoLink(g.link)} /></Tooltip>
                        <Tooltip label="Editar"><IconButton aria-label="Editar" icon={<FiEdit2 />} size="sm" variant="ghost" color="gray.400" _hover={{ color: 'blue.500' }} onClick={() => handleEditGrupo(g)} /></Tooltip>
                        <Tooltip label="Remover"><IconButton aria-label="Remover" icon={<FiTrash2 />} size="sm" variant="ghost" color="gray.400" _hover={{ color: 'red.500' }} onClick={() => { setDeletingGrupo(g); onDeleteOpen() }} /></Tooltip>
                      </HStack>
                    </Flex>
                  ))}
                </VStack>
              )}
            </Box>

            <Box bg="white" rounded="2xl" border="1px solid" borderColor="gray.100" shadow="sm" p={5}>
              <HStack mb={4}>
                <Flex w={8} h={8} rounded="lg" bg="gray.50" align="center" justify="center">
                  <Icon as={FiClock} boxSize={4} color="gray.500" />
                </Flex>
                <Text fontSize="sm" fontWeight="700" color="gray.700">Historico de envios</Text>
              </HStack>

              {historico.length === 0 ? (
                <Box textAlign="center" py={6}>
                  <Text fontSize="sm" color="gray.400">Nenhuma mensagem enviada ainda.</Text>
                </Box>
              ) : (
                <VStack spacing={2} align="stretch" maxH="380px" overflowY="auto">
                  {historico.map((h) => (
                    <Box key={h.idmensagem} p={3} rounded="xl" bg="gray.50" border="1px solid" borderColor="gray.100">
                      <Flex justify="space-between" align="center" mb={1}>
                        <Badge rounded="full" fontSize="2xs" px={2} colorScheme={h.tipo === 'aluno' ? 'cyan' : h.tipo === 'turma' ? 'blue' : h.tipo === 'modalidade' ? 'purple' : h.tipo === 'grupo' ? 'green' : 'orange'}>
                          {h.tipo === 'aluno' ? 'Aluno' : h.tipo === 'turma' ? 'Turma' : h.tipo === 'modalidade' ? 'Modalidade' : h.tipo === 'grupo' ? 'Grupo' : 'Todos'}
                        </Badge>
                        <Text fontSize="xs" color="gray.400">
                          {new Date(h.enviado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </Flex>
                      {h.destino && <Text fontSize="xs" color="gray.500" mb={1}>to {h.destino}</Text>}
                      <Text fontSize="sm" color="gray.700" noOfLines={2}>{h.mensagem}</Text>
                    </Box>
                  ))}
                </VStack>
              )}
            </Box>
          </Box>
        </Flex>
      </Box>

      <Modal isOpen={isGrupoOpen} onClose={onGrupoClose} isCentered size="md">
        <ModalOverlay />
        <ModalContent rounded="2xl">
          <ModalHeader color="gray.800" fontSize="lg" fontWeight="700">{editingGrupo ? 'Editar Grupo' : 'Novo Grupo WhatsApp'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={2}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="sm" color="gray.600">Nome do grupo</FormLabel>
                <Input placeholder="Ex: Beach Tennis  Avancado" value={grupoForm.nome} onChange={(e) => setGrupoForm({ ...grupoForm, nome: e.target.value })} {...inputStyle} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel fontSize="sm" color="gray.600">Link do grupo</FormLabel>
                <Input placeholder="https://chat.whatsapp.com/..." value={grupoForm.link} onChange={(e) => setGrupoForm({ ...grupoForm, link: e.target.value })} {...inputStyle} />
                <Text fontSize="xs" color="gray.400" mt={1}>No WhatsApp: Grupo to Configuracoes to Link de convite to Copiar</Text>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm" color="gray.600">Tipo</FormLabel>
                <Select value={grupoForm.tipo} onChange={(e) => setGrupoForm({ ...grupoForm, tipo: e.target.value as any, referencia_id: '' })} {...inputStyle}>
                  <option value="geral">Geral</option>
                  <option value="turma">Turma</option>
                  <option value="modalidade">Modalidade</option>
                </Select>
              </FormControl>
              {grupoForm.tipo === 'turma' && (
                <FormControl>
                  <FormLabel fontSize="sm" color="gray.600">Turma vinculada</FormLabel>
                  <Select placeholder="Selecione" value={grupoForm.referencia_id} onChange={(e) => setGrupoForm({ ...grupoForm, referencia_id: e.target.value })} {...inputStyle}>
                    {turmas.map((t) => <option key={t.idturma} value={t.idturma}>{t.nome}</option>)}
                  </Select>
                </FormControl>
              )}
              {grupoForm.tipo === 'modalidade' && (
                <FormControl>
                  <FormLabel fontSize="sm" color="gray.600">Modalidade vinculada</FormLabel>
                  <Select placeholder="Selecione" value={grupoForm.referencia_id} onChange={(e) => setGrupoForm({ ...grupoForm, referencia_id: e.target.value })} {...inputStyle}>
                    {modalidades.map((m) => <option key={m.idmodalidade} value={m.idmodalidade}>{m.nome}</option>)}
                  </Select>
                </FormControl>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onGrupoClose} color="gray.500">Cancelar</Button>
            <Button colorScheme="green" onClick={handleSaveGrupo} rounded="lg" fontWeight="700">{editingGrupo ? 'Salvar' : 'Cadastrar'}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog isOpen={isDeleteOpen} leastDestructiveRef={cancelRef as any} onClose={onDeleteClose} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent rounded="2xl">
            <AlertDialogHeader fontSize="lg" fontWeight="700" color="gray.800">Remover grupo</AlertDialogHeader>
            <AlertDialogBody color="gray.600">Tem certeza que deseja remover o grupo <b>{deletingGrupo?.nome}</b>?</AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} variant="ghost" color="gray.500" onClick={onDeleteClose}>Cancelar</Button>
              <Button colorScheme="red" onClick={confirmDeleteGrupo} ml={3} rounded="lg">Remover</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </AppLayout>
  )
}
