import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '../lib/supabase'

export type TipoNotificacao = 'atraso' | 'vencimento' | 'info'

export interface Notificacao {
  id: string
  tipo: TipoNotificacao
  titulo: string
  descricao: string
  alunoNome: string
  detalhe: string
  valor?: number
  daysInfo: number
}

interface NotificacoesContextType {
  notificacoes: Notificacao[]
  loading: boolean
  lidasIds: Set<string>
  unreadCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotificacao: (id: string) => void
  reload: () => void
}

const NotificacoesContext = createContext<NotificacoesContextType | undefined>(undefined)

const LS_LIDAS = 'orla44_notif_lidas'
const LS_DELETADAS = 'orla44_notif_deletadas'

function loadSet(key: string): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(key) ?? '[]')) }
  catch { return new Set() }
}

function saveSet(key: string, set: Set<string>) {
  localStorage.setItem(key, JSON.stringify([...set]))
}

export function NotificacoesProvider({ children }: { children: ReactNode }) {
  const [all, setAll] = useState<Notificacao[]>([])
  const [loading, setLoading] = useState(true)
  const [lidasIds, setLidasIds] = useState<Set<string>>(() => loadSet(LS_LIDAS))
  const [deletadasIds, setDeletadasIds] = useState<Set<string>>(() => loadSet(LS_DELETADAS))

  const getMesAtualRef = () => {
    const now = new Date()
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ]
    return `${meses[now.getMonth()]}/${now.getFullYear()}`
  }

  const formatDate = (date: string) => {
    const [ano, mes, dia] = date.split('-')
    return `${dia}/${mes}/${ano}`
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const today = new Date()
      const todayStr = today.toISOString().slice(0, 10)
      const in7days = new Date(today)
      in7days.setDate(in7days.getDate() + 7)
      const in7daysStr = in7days.toISOString().slice(0, 10)
      const mesRef = getMesAtualRef()

      const [
        { data: atrasadas, error: errA },
        { data: aVencer, error: errV },
        { data: alunos, error: errAl },
        { data: mensDoMes, error: errM },
      ] = await Promise.all([
        supabase
          .from('mensalidade')
          .select('idmensalidade, valor, data_vencimento, mes_referencia, aluno:aluno_id(nome)')
          .eq('situacao', 2)
          .order('data_vencimento', { ascending: true }),
        supabase
          .from('mensalidade')
          .select('idmensalidade, valor, data_vencimento, mes_referencia, aluno:aluno_id(nome)')
          .eq('situacao', 0)
          .gte('data_vencimento', todayStr)
          .lte('data_vencimento', in7daysStr)
          .order('data_vencimento', { ascending: true }),
        supabase.from('aluno').select('idaluno, nome').eq('situacao', 1),
        supabase.from('mensalidade').select('aluno_id').eq('mes_referencia', mesRef),
      ])

      if (errA) throw errA
      if (errV) throw errV
      if (errAl) throw errAl
      if (errM) throw errM

      const result: Notificacao[] = []

      ;(atrasadas ?? []).forEach((m: any) => {
        const venc = new Date(m.data_vencimento + 'T00:00:00')
        const dias = Math.floor((today.getTime() - venc.getTime()) / 86400000)
        result.push({
          id: `atraso-${m.idmensalidade}`,
          tipo: 'atraso',
          titulo: 'Mensalidade em Atraso',
          descricao: `Ref.: ${m.mes_referencia} · Venceu em ${formatDate(m.data_vencimento)}`,
          alunoNome: m.aluno?.nome ?? 'Aluno',
          detalhe: `${dias} dia${dias !== 1 ? 's' : ''} em atraso`,
          valor: m.valor,
          daysInfo: dias,
        })
      })

      ;(aVencer ?? []).forEach((m: any) => {
        const venc = new Date(m.data_vencimento + 'T00:00:00')
        const dias = Math.floor((venc.getTime() - today.getTime()) / 86400000)
        result.push({
          id: `vencimento-${m.idmensalidade}`,
          tipo: 'vencimento',
          titulo: 'Mensalidade a Vencer',
          descricao: `Ref.: ${m.mes_referencia} · Vencimento: ${formatDate(m.data_vencimento)}`,
          alunoNome: m.aluno?.nome ?? 'Aluno',
          detalhe: dias === 0 ? 'Vence hoje!' : `Vence em ${dias} dia${dias !== 1 ? 's' : ''}`,
          valor: m.valor,
          daysInfo: dias,
        })
      })

      const comMens = new Set((mensDoMes ?? []).map((e: any) => e.aluno_id))
      ;(alunos ?? []).filter((a: any) => !comMens.has(a.idaluno)).forEach((a: any) => {
        result.push({
          id: `info-${a.idaluno}`,
          tipo: 'info',
          titulo: 'Sem Mensalidade no Mês',
          descricao: `Nenhuma cobrança gerada para ${mesRef}`,
          alunoNome: a.nome,
          detalhe: 'Gerar em Mensalidades',
          daysInfo: 0,
        })
      })

      const ordem: Record<TipoNotificacao, number> = { atraso: 0, vencimento: 1, info: 2 }
      result.sort((a, b) => ordem[a.tipo] - ordem[b.tipo] || b.daysInfo - a.daysInfo)
      setAll(result)
    } catch {
      // silencioso — erros são tratados no componente que usar o contexto
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()

    const channel = supabase
      .channel('notificacoes-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mensalidade' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'aluno' }, () => load())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [load])

  const markAsRead = useCallback((id: string) => {
    setLidasIds(prev => {
      const next = new Set(prev)
      next.add(id)
      saveSet(LS_LIDAS, next)
      return next
    })
  }, [])

  const markAllAsRead = useCallback(() => {
    setLidasIds(prev => {
      const next = new Set(prev)
      all.forEach(n => { if (!deletadasIds.has(n.id)) next.add(n.id) })
      saveSet(LS_LIDAS, next)
      return next
    })
  }, [all, deletadasIds])

  const deleteNotificacao = useCallback((id: string) => {
    setDeletadasIds(prev => {
      const next = new Set(prev)
      next.add(id)
      saveSet(LS_DELETADAS, next)
      return next
    })
    setLidasIds(prev => {
      const next = new Set(prev)
      next.add(id)
      saveSet(LS_LIDAS, next)
      return next
    })
  }, [])

  const notificacoes = all.filter(n => !deletadasIds.has(n.id))
  const unreadCount = notificacoes.filter(n => !lidasIds.has(n.id)).length

  return (
    <NotificacoesContext.Provider
      value={{ notificacoes, loading, lidasIds, unreadCount, markAsRead, markAllAsRead, deleteNotificacao, reload: load }}
    >
      {children}
    </NotificacoesContext.Provider>
  )
}

export function useNotificacoes() {
  const ctx = useContext(NotificacoesContext)
  if (!ctx) throw new Error('useNotificacoes must be used within NotificacoesProvider')
  return ctx
}
