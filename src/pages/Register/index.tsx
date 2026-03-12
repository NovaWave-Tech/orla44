import { useState, type FormEvent } from 'react'
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Icon,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  Link as ChakraLink,
  Text,
  useToast,
  VStack,
  Divider,
  HStack,
  FormErrorMessage,
} from '@chakra-ui/react'
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser, FiArrowRight } from 'react-icons/fi'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import AuthLayout from '../../components/AuthLayout'

export default function RegisterPage() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { signUp } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const passwordsMatch = confirmPassword === '' || password === confirmPassword

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!nome || !email || !password || !confirmPassword) {
      toast({
        title: 'Preencha todos os campos.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top',
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'A senha deve ter no mínimo 6 caracteres.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top',
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: 'As senhas não coincidem.',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      })
      return
    }

    setIsLoading(true)

    const { error } = await signUp(email, password, nome)

    if (error) {
      toast({
        title: 'Erro ao criar conta',
        description: error.message || 'Tente novamente mais tarde.',
        status: 'error',
        duration: 4000,
        isClosable: true,
        position: 'top',
      })
    } else {
      toast({
        title: 'Conta criada com sucesso!',
        description: 'Verifique seu e-mail para confirmar o cadastro.',
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'top',
      })
      navigate('/login')
    }

    setIsLoading(false)
  }

  const inputStyles = {
    bg: 'gray.50',
    border: '1px solid',
    borderColor: 'gray.200',
    rounded: 'xl',
    _hover: { borderColor: 'gray.300' },
    _focus: {
      borderColor: 'brand.500',
      boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
      bg: 'white',
    },
    _placeholder: { color: 'gray.400' },
  }

  return (
    <AuthLayout>
      <Box w="full" maxW="440px">
        {/* Mobile logo */}
        <Flex display={{ base: 'flex', lg: 'none' }} justify="center" mb={6}>
          <Image src="/ArenaFitway.jpg" alt="ArenaFitway" w="120px" borderRadius="lg" />
        </Flex>

        <Box bg="white" rounded="2xl" shadow="xl" p={{ base: 8, md: 10 }} border="1px solid" borderColor="gray.100">
          {/* Header */}
          <VStack spacing={1} mb={7} align="start">
            <Heading size="lg" color="gray.800" fontWeight="700">
              Criar conta
            </Heading>
            <Text color="gray.500" fontSize="sm">
              Preencha os dados abaixo para começar a usar o sistema
            </Text>
          </VStack>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              {/* Nome */}
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
                  Nome completo
                </FormLabel>
                <InputGroup size="lg">
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FiUser} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    type="text"
                    placeholder="Seu nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    {...inputStyles}
                  />
                </InputGroup>
              </FormControl>

              {/* Email */}
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
                  E-mail
                </FormLabel>
                <InputGroup size="lg">
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FiMail} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    {...inputStyles}
                  />
                </InputGroup>
              </FormControl>

              {/* Senha */}
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
                  Senha
                </FormLabel>
                <InputGroup size="lg">
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FiLock} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mín. 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    {...inputStyles}
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      icon={showPassword ? <FiEyeOff /> : <FiEye />}
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      color="gray.400"
                      _hover={{ color: 'gray.600', bg: 'transparent' }}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              {/* Confirmar Senha */}
              <FormControl isInvalid={!passwordsMatch}>
                <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
                  Confirmar senha
                </FormLabel>
                <InputGroup size="lg">
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FiLock} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    {...inputStyles}
                    borderColor={!passwordsMatch ? 'red.300' : 'gray.200'}
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
                      icon={showConfirm ? <FiEyeOff /> : <FiEye />}
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowConfirm(!showConfirm)}
                      color="gray.400"
                      _hover={{ color: 'gray.600', bg: 'transparent' }}
                    />
                  </InputRightElement>
                </InputGroup>
                {!passwordsMatch && (
                  <FormErrorMessage fontSize="xs">As senhas não coincidem.</FormErrorMessage>
                )}
              </FormControl>

              <Button
                type="submit"
                w="full"
                size="lg"
                bg="brand.500"
                color="white"
                rounded="xl"
                _hover={{ bg: 'brand.600', transform: 'translateY(-1px)', shadow: 'lg' }}
                _active={{ bg: 'brand.700', transform: 'translateY(0)' }}
                transition="all 0.2s"
                isLoading={isLoading}
                loadingText="Criando conta..."
                mt={1}
                fontSize="md"
                fontWeight="600"
                rightIcon={<FiArrowRight />}
              >
                Criar conta
              </Button>
            </VStack>
          </form>

          {/* Divider */}
          <HStack my={6}>
            <Divider borderColor="gray.200" />
            <Text fontSize="xs" color="gray.400" whiteSpace="nowrap" px={3}>
              ou
            </Text>
            <Divider borderColor="gray.200" />
          </HStack>

          {/* Login link */}
          <Text textAlign="center" fontSize="sm" color="gray.500">
            Já tem uma conta?{' '}
            <ChakraLink
              as={Link}
              to="/login"
              color="brand.500"
              fontWeight="600"
              _hover={{ color: 'brand.600', textDecoration: 'underline' }}
            >
              Fazer login
            </ChakraLink>
          </Text>
        </Box>

        {/* Footer */}
        <Text mt={6} textAlign="center" fontSize="xs" color="gray.400">
          © {new Date().getFullYear()} ArenaFitway — Todos os direitos reservados.
        </Text>
      </Box>
    </AuthLayout>
  )
}
