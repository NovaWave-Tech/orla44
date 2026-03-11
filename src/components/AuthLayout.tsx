import { Box, Flex, Image } from '@chakra-ui/react'
import type { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <Flex minH="100vh">
      {/* Left Panel — Branding */}
      <Flex
        display={{ base: 'none', lg: 'flex' }}
        w="50%"
        bg="linear-gradient(160deg, #1e1b2e 0%, #4a1942 25%, #c2410c 55%, #f97316 75%, #fbbf24 100%)"
        direction="column"
        align="center"
        justify="center"
        position="relative"
        overflow="hidden"
      >
        {/* Decorative circles */}
        <Box
          position="absolute"
          top="-80px"
          right="-80px"
          w="300px"
          h="300px"
          borderRadius="full"
          bg="whiteAlpha.100"
        />
        <Box
          position="absolute"
          bottom="-120px"
          left="-60px"
          w="400px"
          h="400px"
          borderRadius="full"
          bg="whiteAlpha.50"
        />
        <Box
          position="absolute"
          top="40%"
          left="10%"
          w="150px"
          h="150px"
          borderRadius="full"
          bg="whiteAlpha.50"
        />
        {/* Sun glow */}
        <Box
          position="absolute"
          top="35%"
          right="15%"
          w="200px"
          h="200px"
          borderRadius="full"
          bg="radial-gradient(circle, rgba(251,191,36,0.3) 0%, transparent 70%)"
        />

        {/* Logo */}
        <Image
          src="/Orla44_sfundo.png"
          alt="Orla44 Arena"
          w="220px"
          mb={8}
          zIndex={1}
          filter="drop-shadow(0 4px 20px rgba(0,0,0,0.3))"
        />

        {/* Tagline */}
        <Box textAlign="center" zIndex={1} px={10}>
          <Box
            fontSize="2xl"
            fontWeight="bold"
            color="white"
            mb={3}
            letterSpacing="tight"
          >
            Gestão completa para sua arena
          </Box>
          <Box fontSize="md" color="whiteAlpha.800" maxW="380px" lineHeight="tall">
            Controle alunos, turmas, mensalidades e muito mais em uma única plataforma.
          </Box>
        </Box>
      </Flex>

      {/* Right Panel — Form */}
      <Flex
        w={{ base: '100%', lg: '50%' }}
        align="center"
        justify="center"
        bg="#faf8f5"
        px={4}
      >
        {children}
      </Flex>
    </Flex>
  )
}
