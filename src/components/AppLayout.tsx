import { Box, Flex } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

interface AppLayoutProps {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <Flex minH="100vh" bg="#faf8f5">
      {/* Sidebar — largura fixa, não sai do fluxo */}
      <Box
        as="aside"
        w={{ base: '72px', xl: '240px' }}
        flexShrink={0}
        position="sticky"
        top={0}
        h="100vh"
        overflowY="auto"
        overflowX="hidden"
      >
        <Sidebar />
      </Box>

      {/* Main content — TopBar + página */}
      <Flex flex={1} minW={0} direction="column" minH="100vh">
        <TopBar />
        <Box flex={1}>
          {children}
        </Box>
      </Flex>
    </Flex>
  )
}
