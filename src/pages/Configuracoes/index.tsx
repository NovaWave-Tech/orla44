import { useState, useRef } from 'react'
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Icon,
  Button,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Avatar,
  Badge,
  Divider,
  InputGroup,
  InputRightElement,
  IconButton,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
} from '@chakra-ui/react'
import {
  FiUser,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheck,
  FiShield,
  FiSave,
  FiAlertTriangle,
} from 'react-icons/fi'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import AppLayout from '../../components/AppLayout'

export default function ConfiguracoesPage() {
  const { user } = useAuth()
  const toast = useToast()

  const userName = user?.user_metadata?.nome ?? ''
  const userEmail = user?.email ?? ''

  // — Dados pessoais —
  const [nome, setNome] = useState(userName)
  const [email, setEmail] = useState(userEmail)
  const [savingDados, setSavingDados] = useState(false)

  // — Senha —
  const [senhaAtual, setSenhaAtual] = useState('')
  const [showSenhaAtual, setShowSenhaAtual] = useState(false)
  const [verificando, setVerificando] = useState(false)
  const [senhaVerificada, setSenhaVerificada] = useState(false)

  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [showNovaSenha, setShowNovaSenha] = useState(false)
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false)
  const [alterandoSenha, setAlterandoSenha] = useState(false)

  // — Confirmação de email —
  const { isOpen: isEmailAlertOpen, onOpen: onEmailAlertOpen, onClose: onEmailAlertClose } = useDisclosure()
  const cancelRef = useRef<HTMLButtonElement>(null)

  const nomeInvalido = nome.trim().length < 2
  const emailInvalido = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const senhasDiferentes = novaSenha !== confirmarSenha
  const senhaFraca = novaSenha.length > 0 && novaSenha.length < 6

  // ── Salvar nome e email ───────────────────────────────────────────────────
  const handleSalvarDados = async () => {
    if (nomeInvalido || emailInvalido) return

    const emailMudou = email.trim().toLowerCase() !== userEmail.toLowerCase()

    if (emailMudou) {
      onEmailAlertOpen()
      return
    }

    await salvarDados()
  }

  const salvarDados = async () => {
    setSavingDados(true)
    try {
      const updates: Record<string, unknown> = { data: { nome: nome.trim() } }
      const emailMudou = email.trim().toLowerCase() !== userEmail.toLowerCase()
      if (emailMudou) updates.email = email.trim()

      const { error } = await supabase.auth.updateUser(updates)
      if (error) throw error

      toast({
        title: emailMudou
          ? 'Confirme o novo e-mail'
          : 'Dados atualizados com sucesso',
        description: emailMudou
          ? 'Um link de confirmação foi enviado para o novo e-mail.'
          : undefined,
        status: 'success',
        duration: 5000,
        position: 'top',
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar dados',
        description: err.message,
        status: 'error',
        duration: 4000,
        position: 'top',
      })
    } finally {
      setSavingDados(false)
      onEmailAlertClose()
    }
  }

  // ── Verificar senha atual ─────────────────────────────────────────────────
  const handleVerificarSenha = async () => {
    if (!senhaAtual) return
    setVerificando(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: senhaAtual,
      })
      if (error) throw error

      setSenhaVerificada(true)
      toast({
        title: 'Senha verificada',
        description: 'Agora você pode definir uma nova senha.',
        status: 'success',
        duration: 3000,
        position: 'top',
      })
    } catch {
      toast({
        title: 'Senha incorreta',
        description: 'A senha atual informada não está correta.',
        status: 'error',
        duration: 4000,
        position: 'top',
      })
    } finally {
      setVerificando(false)
    }
  }

  // ── Alterar senha ─────────────────────────────────────────────────────────
  const handleAlterarSenha = async () => {
    if (senhasDiferentes || senhaFraca || !novaSenha) return
    setAlterandoSenha(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: novaSenha })
      if (error) throw error

      toast({
        title: 'Senha alterada com sucesso',
        status: 'success',
        duration: 3000,
        position: 'top',
      })

      // Reset the password section
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmarSenha('')
      setSenhaVerificada(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao alterar senha',
        description: err.message,
        status: 'error',
        duration: 4000,
        position: 'top',
      })
    } finally {
      setAlterandoSenha(false)
    }
  }

  const dadosMudaram =
    nome.trim() !== userName || email.trim().toLowerCase() !== userEmail.toLowerCase()

  return (
    <AppLayout>
      <Box p={{ base: 4, md: 6, lg: 8 }} maxW="900px" w="full" mx="auto">

        {/* ── Cabeçalho do perfil ─────────────────────────────────────────── */}
        <Flex
          bg="white"
          rounded="2xl"
          border="1px solid"
          borderColor="gray.100"
          p={{ base: 5, md: 6 }}
          mb={6}
          align="center"
          gap={5}
          wrap="wrap"
        >
          <Avatar
            size="xl"
            name={userName}
            bg="brand.500"
            color="white"
            fontWeight="700"
            fontSize="2xl"
          />
          <Box flex={1}>
            <Text fontSize="xl" fontWeight="700" color="gray.800" lineHeight="1.2">
              {userName || 'Usuário'}
            </Text>
            <Text fontSize="sm" color="gray.400" mt={0.5}>
              {userEmail}
            </Text>
            <Badge
              mt={2}
              colorScheme="green"
              rounded="full"
              px={3}
              py={0.5}
              fontSize="xs"
              fontWeight="600"
            >
              Administrador
            </Badge>
          </Box>
        </Flex>

        {/* ── Grid: Dados + Segurança ─────────────────────────────────────── */}
        <Flex gap={5} direction={{ base: 'column', lg: 'row' }} align="flex-start">

          {/* Card — Informações Pessoais */}
          <Box
            flex={1}
            bg="white"
            rounded="2xl"
            border="1px solid"
            borderColor="gray.100"
            p={{ base: 5, md: 6 }}
          >
            <HStack spacing={3} mb={5}>
              <Flex
                w={9}
                h={9}
                rounded="xl"
                bg="brand.50"
                align="center"
                justify="center"
                flexShrink={0}
              >
                <Icon as={FiUser} boxSize={4} color="brand.500" />
              </Flex>
              <Box>
                <Text fontSize="md" fontWeight="700" color="gray.800" lineHeight="1.2">
                  Informações Pessoais
                </Text>
                <Text fontSize="xs" color="gray.400">
                  Atualize seu nome e e-mail
                </Text>
              </Box>
            </HStack>

            <Divider mb={5} />

            <VStack spacing={4} align="stretch">
              <FormControl isInvalid={nome.length > 0 && nomeInvalido}>
                <FormLabel fontSize="sm" fontWeight="600" color="gray.600" mb={1}>
                  <HStack spacing={1.5}>
                    <Icon as={FiUser} boxSize={3.5} />
                    <Text>Nome completo</Text>
                  </HStack>
                </FormLabel>
                <Input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome completo"
                  rounded="xl"
                  bg="gray.50"
                  border="1px solid"
                  borderColor="gray.200"
                  _focus={{ bg: 'white', borderColor: 'brand.500' }}
                  fontSize="sm"
                />
                <FormErrorMessage fontSize="xs">
                  Nome deve ter pelo menos 2 caracteres.
                </FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={email.length > 0 && emailInvalido}>
                <FormLabel fontSize="sm" fontWeight="600" color="gray.600" mb={1}>
                  <HStack spacing={1.5}>
                    <Icon as={FiMail} boxSize={3.5} />
                    <Text>E-mail</Text>
                  </HStack>
                </FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  rounded="xl"
                  bg="gray.50"
                  border="1px solid"
                  borderColor="gray.200"
                  _focus={{ bg: 'white', borderColor: 'brand.500' }}
                  fontSize="sm"
                />
                <FormErrorMessage fontSize="xs">
                  Informe um e-mail válido.
                </FormErrorMessage>
              </FormControl>

              <Button
                leftIcon={<FiSave />}
                colorScheme="brand"
                rounded="xl"
                mt={1}
                isLoading={savingDados}
                loadingText="Salvando..."
                isDisabled={!dadosMudaram || nomeInvalido || emailInvalido}
                onClick={handleSalvarDados}
                w="full"
              >
                Salvar Alterações
              </Button>
            </VStack>
          </Box>

          {/* Card — Segurança / Trocar Senha */}
          <Box
            flex={1}
            bg="white"
            rounded="2xl"
            border="1px solid"
            borderColor="gray.100"
            p={{ base: 5, md: 6 }}
          >
            <HStack spacing={3} mb={5}>
              <Flex
                w={9}
                h={9}
                rounded="xl"
                bg="golden.50"
                align="center"
                justify="center"
                flexShrink={0}
              >
                <Icon as={FiShield} boxSize={4} color="golden.500" />
              </Flex>
              <Box>
                <Text fontSize="md" fontWeight="700" color="gray.800" lineHeight="1.2">
                  Segurança
                </Text>
                <Text fontSize="xs" color="gray.400">
                  Altere sua senha de acesso
                </Text>
              </Box>
            </HStack>

            <Divider mb={5} />

            <VStack spacing={4} align="stretch">

              {/* Etapa 1 — Senha atual */}
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="600" color="gray.600" mb={1}>
                  <HStack spacing={1.5}>
                    <Icon as={FiLock} boxSize={3.5} />
                    <Text>Senha atual</Text>
                  </HStack>
                </FormLabel>
                <InputGroup>
                  <Input
                    type={showSenhaAtual ? 'text' : 'password'}
                    value={senhaAtual}
                    onChange={(e) => {
                      setSenhaAtual(e.target.value)
                      if (senhaVerificada) setSenhaVerificada(false)
                    }}
                    placeholder="Digite sua senha atual"
                    rounded="xl"
                    bg={senhaVerificada ? 'green.50' : 'gray.50'}
                    border="1px solid"
                    borderColor={senhaVerificada ? 'green.300' : 'gray.200'}
                    _focus={{ bg: 'white', borderColor: 'brand.500' }}
                    fontSize="sm"
                    isReadOnly={senhaVerificada}
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label="Mostrar senha"
                      icon={showSenhaAtual ? <FiEyeOff /> : <FiEye />}
                      size="sm"
                      variant="ghost"
                      color="gray.400"
                      onClick={() => setShowSenhaAtual((v) => !v)}
                      tabIndex={-1}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              {/* Botão Verificar / Badge verificada */}
              {!senhaVerificada ? (
                <Button
                  colorScheme="gray"
                  variant="outline"
                  rounded="xl"
                  isLoading={verificando}
                  loadingText="Verificando..."
                  isDisabled={!senhaAtual}
                  onClick={handleVerificarSenha}
                  w="full"
                  leftIcon={<FiShield />}
                >
                  Verificar Senha
                </Button>
              ) : (
                <Flex
                  align="center"
                  gap={2}
                  bg="green.50"
                  border="1px solid"
                  borderColor="green.200"
                  rounded="xl"
                  px={4}
                  py={2.5}
                >
                  <Icon as={FiCheck} boxSize={4} color="green.500" />
                  <Text fontSize="sm" color="green.700" fontWeight="600">
                    Senha verificada
                  </Text>
                </Flex>
              )}

              {/* Etapa 2 — Nova senha (visível só após verificação) */}
              {senhaVerificada && (
                <>
                  <Divider />

                  <FormControl isInvalid={senhaFraca}>
                    <FormLabel fontSize="sm" fontWeight="600" color="gray.600" mb={1}>
                      Nova senha
                    </FormLabel>
                    <InputGroup>
                      <Input
                        type={showNovaSenha ? 'text' : 'password'}
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        rounded="xl"
                        bg="gray.50"
                        border="1px solid"
                        borderColor="gray.200"
                        _focus={{ bg: 'white', borderColor: 'brand.500' }}
                        fontSize="sm"
                      />
                      <InputRightElement>
                        <IconButton
                          aria-label="Mostrar nova senha"
                          icon={showNovaSenha ? <FiEyeOff /> : <FiEye />}
                          size="sm"
                          variant="ghost"
                          color="gray.400"
                          onClick={() => setShowNovaSenha((v) => !v)}
                          tabIndex={-1}
                        />
                      </InputRightElement>
                    </InputGroup>
                    <FormErrorMessage fontSize="xs">
                      A senha deve ter pelo menos 6 caracteres.
                    </FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={confirmarSenha.length > 0 && senhasDiferentes}>
                    <FormLabel fontSize="sm" fontWeight="600" color="gray.600" mb={1}>
                      Confirmar nova senha
                    </FormLabel>
                    <InputGroup>
                      <Input
                        type={showConfirmarSenha ? 'text' : 'password'}
                        value={confirmarSenha}
                        onChange={(e) => setConfirmarSenha(e.target.value)}
                        placeholder="Repita a nova senha"
                        rounded="xl"
                        bg="gray.50"
                        border="1px solid"
                        borderColor="gray.200"
                        _focus={{ bg: 'white', borderColor: 'brand.500' }}
                        fontSize="sm"
                      />
                      <InputRightElement>
                        <IconButton
                          aria-label="Mostrar confirmação"
                          icon={showConfirmarSenha ? <FiEyeOff /> : <FiEye />}
                          size="sm"
                          variant="ghost"
                          color="gray.400"
                          onClick={() => setShowConfirmarSenha((v) => !v)}
                          tabIndex={-1}
                        />
                      </InputRightElement>
                    </InputGroup>
                    <FormErrorMessage fontSize="xs">
                      As senhas não coincidem.
                    </FormErrorMessage>
                  </FormControl>

                  <Button
                    leftIcon={<FiLock />}
                    colorScheme="brand"
                    rounded="xl"
                    isLoading={alterandoSenha}
                    loadingText="Alterando..."
                    isDisabled={!novaSenha || senhaFraca || senhasDiferentes}
                    onClick={handleAlterarSenha}
                    w="full"
                  >
                    Alterar Senha
                  </Button>
                </>
              )}
            </VStack>
          </Box>
        </Flex>
      </Box>

      {/* ── AlertDialog — Confirmação de troca de e-mail ─────────────────── */}
      <AlertDialog
        isOpen={isEmailAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onEmailAlertClose}
        isCentered
      >
        <AlertDialogOverlay bg="blackAlpha.600" backdropFilter="blur(4px)">
          <AlertDialogContent rounded="2xl" mx={4}>
            <AlertDialogHeader fontSize="lg" fontWeight="700" color="gray.800">
              <HStack spacing={2}>
                <Icon as={FiAlertTriangle} color="golden.500" />
                <Text>Alterar E-mail</Text>
              </HStack>
            </AlertDialogHeader>
            <AlertDialogBody color="gray.600" fontSize="sm">
              Você está prestes a alterar seu e-mail de{' '}
              <Text as="span" fontWeight="600" color="gray.800">
                {userEmail}
              </Text>{' '}
              para{' '}
              <Text as="span" fontWeight="600" color="brand.600">
                {email}
              </Text>
              .<br /><br />
              Um link de confirmação será enviado para o novo e-mail. O e-mail atual
              continuará sendo usado para login até a confirmação.
            </AlertDialogBody>
            <AlertDialogFooter gap={3}>
              <Button ref={cancelRef} onClick={onEmailAlertClose} variant="ghost" rounded="xl">
                Cancelar
              </Button>
              <Button
                colorScheme="brand"
                onClick={salvarDados}
                isLoading={savingDados}
                rounded="xl"
                leftIcon={<FiSave />}
              >
                Confirmar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </AppLayout>
  )
}
