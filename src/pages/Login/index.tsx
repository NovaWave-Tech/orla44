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
} from '@chakra-ui/react'
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import AuthLayout from '../../components/AuthLayout'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { signIn } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast({
        title: 'Preencha todos os campos.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top',
      })
      return
    }

    setIsLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      toast({
        title: 'Erro ao fazer login',
        description: 'E-mail ou senha inválidos.',
        status: 'error',
        duration: 4000,
        isClosable: true,
        position: 'top',
      })
    } else {
      toast({
        title: 'Login realizado com sucesso!',
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top',
      })
      navigate('/')
    }

    setIsLoading(false)
  }

  return (
    <AuthLayout>
      <Box w="full" maxW="440px">
        {/* Mobile logo */}
        <Flex display={{ base: 'flex', lg: 'none' }} justify="center" mb={6}>
          <Image src="/Orla44_sfundo.png" alt="Orla44 Arena" w="120px" />
        </Flex>

        <Box bg="white" rounded="2xl" shadow="xl" p={{ base: 8, md: 10 }} border="1px solid" borderColor="gray.100">
          {/* Header */}
          <VStack spacing={1} mb={8} align="start">
            <Heading size="lg" color="gray.800" fontWeight="700">
              Bem-vindo de volta
            </Heading>
            <Text color="gray.500" fontSize="sm">
              Entre com suas credenciais para acessar o sistema
            </Text>
          </VStack>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <VStack spacing={5}>
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
                    bg="gray.50"
                    border="1px solid"
                    borderColor="gray.200"
                    rounded="xl"
                    _hover={{ borderColor: 'gray.300' }}
                    _focus={{
                      borderColor: 'brand.500',
                      boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
                      bg: 'white',
                    }}
                    _placeholder={{ color: 'gray.400' }}
                  />
                </InputGroup>
              </FormControl>

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
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    bg="gray.50"
                    border="1px solid"
                    borderColor="gray.200"
                    rounded="xl"
                    _hover={{ borderColor: 'gray.300' }}
                    _focus={{
                      borderColor: 'brand.500',
                      boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
                      bg: 'white',
                    }}
                    _placeholder={{ color: 'gray.400' }}
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
                loadingText="Entrando..."
                mt={1}
                fontSize="md"
                fontWeight="600"
                rightIcon={<FiArrowRight />}
              >
                Entrar
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

          {/* Register link */}
          <Text textAlign="center" fontSize="sm" color="gray.500">
            Não tem uma conta?{' '}
            <ChakraLink
              as={Link}
              to="/cadastro"
              color="brand.500"
              fontWeight="600"
              _hover={{ color: 'brand.600', textDecoration: 'underline' }}
            >
              Criar conta
            </ChakraLink>
          </Text>
        </Box>

        {/* Footer */}
        <Text mt={6} textAlign="center" fontSize="xs" color="gray.400">
          © {new Date().getFullYear()} Orla44 Arena — Todos os direitos reservados.
        </Text>
      </Box>
    </AuthLayout>
  )
}
