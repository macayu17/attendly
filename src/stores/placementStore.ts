import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { PlacementSession } from '@/lib/database.types'

interface PlacementState {
    sessions: PlacementSession[]
    loading: boolean
    error: string | null

    fetchSessions: (userId: string) => Promise<void>
    addSession: (session: Omit<PlacementSession, 'id' | 'created_at'>) => Promise<boolean>
    updateSessionStatus: (id: string, status: 'pending' | 'attended' | 'missed') => Promise<boolean>
    deleteSession: (id: string) => Promise<boolean>
    clearError: () => void
    reset: () => void
}

const initialState = {
    sessions: [] as PlacementSession[],
    loading: false,
    error: null as string | null,
}

export const usePlacementStore = create<PlacementState>()((set) => ({
    ...initialState,

    fetchSessions: async (userId: string) => {
        set({ loading: true, error: null })
        try {
            const { data, error } = await supabase
                .from('placement_sessions')
                .select('*')
                .eq('user_id', userId)
                .order('date', { ascending: false })

            if (error) throw error
            set({ sessions: data || [], loading: false })
        } catch (err: any) {
            set({ error: err.message, loading: false })
        }
    },

    addSession: async (session) => {
        set({ loading: true, error: null })
        try {
            const { data, error } = await supabase
                .from('placement_sessions')
                .insert(session)
                .select()
                .single()

            if (error) throw error

            set((state) => ({
                sessions: [data, ...state.sessions],
                loading: false,
            }))
            return true
        } catch (err: any) {
            set({ error: err.message, loading: false })
            return false
        }
    },

    updateSessionStatus: async (id, status) => {
        set({ loading: true, error: null })
        try {
            const { error } = await supabase
                .from('placement_sessions')
                .update({ status })
                .eq('id', id)

            if (error) throw error

            set((state) => ({
                sessions: state.sessions.map((s) =>
                    s.id === id ? { ...s, status } : s
                ),
                loading: false,
            }))
            return true
        } catch (err: any) {
            set({ error: err.message, loading: false })
            return false
        }
    },

    deleteSession: async (id) => {
        set({ loading: true, error: null })
        try {
            const { error } = await supabase
                .from('placement_sessions')
                .delete()
                .eq('id', id)

            if (error) throw error

            set((state) => ({
                sessions: state.sessions.filter((s) => s.id !== id),
                loading: false,
            }))
            return true
        } catch (err: any) {
            set({ error: err.message, loading: false })
            return false
        }
    },

    clearError: () => set({ error: null }),
    reset: () => set(initialState),
}))
