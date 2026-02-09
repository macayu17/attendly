import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
    user: User | null
    session: Session | null
    loading: boolean
    error: string | null

    // Actions
    signUp: (email: string, password: string) => Promise<void>
    signIn: (email: string, password: string) => Promise<void>
    signOut: () => Promise<void>
    updateProfile: (updates: { data: { full_name?: string } }) => Promise<void>
    updatePassword: (password: string) => Promise<void>
    resetPassword: (email: string) => Promise<void>
    clearError: () => void
    initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            session: null,
            loading: true,
            error: null,

            initialize: async () => {
                try {
                    const { data: { session } } = await supabase.auth.getSession()
                    set({
                        session,
                        user: session?.user ?? null,
                        loading: false,
                    })

                    // Listen for auth changes
                    supabase.auth.onAuthStateChange((_event, session) => {
                        set({
                            session,
                            user: session?.user ?? null,
                        })
                    })
                } catch (error) {
                    set({ loading: false, error: 'Failed to initialize auth' })
                }
            },

            signUp: async (email: string, password: string) => {
                set({ loading: true, error: null })
                try {
                    const { data, error } = await supabase.auth.signUp({
                        email,
                        password,
                    })

                    if (error) throw error

                    set({
                        user: data.user,
                        session: data.session,
                        loading: false,
                    })
                } catch (error) {
                    set({
                        loading: false,
                        error: error instanceof Error ? error.message : 'Sign up failed',
                    })
                }
            },

            signIn: async (email: string, password: string) => {
                set({ loading: true, error: null })
                try {
                    const { data, error } = await supabase.auth.signInWithPassword({
                        email,
                        password,
                    })

                    if (error) throw error

                    set({
                        user: data.user,
                        session: data.session,
                        loading: false,
                    })
                } catch (error) {
                    set({
                        loading: false,
                        error: error instanceof Error ? error.message : 'Sign in failed',
                    })
                }
            },

            signOut: async () => {
                set({ loading: true, error: null })
                try {
                    await supabase.auth.signOut()
                    set({
                        user: null,
                        session: null,
                        loading: false,
                    })
                } catch (error) {
                    set({
                        loading: false,
                        error: error instanceof Error ? error.message : 'Sign out failed',
                    })
                }
            },

            updateProfile: async (updates) => {
                set({ loading: true, error: null })
                try {
                    const { data, error } = await supabase.auth.updateUser(updates)
                    if (error) throw error
                    set({
                        user: data.user,
                        loading: false,
                    })
                } catch (error) {
                    set({
                        loading: false,
                        error: error instanceof Error ? error.message : 'Update failed',
                    })
                }
            },

            updatePassword: async (password: string) => {
                set({ loading: true, error: null })
                try {
                    const { error } = await supabase.auth.updateUser({ password })
                    if (error) throw error
                    set({ loading: false })
                } catch (error) {
                    set({
                        loading: false,
                        error: error instanceof Error ? error.message : 'Update password failed',
                    })
                    throw error
                }
            },
            resetPassword: async (email) => {
                set({ loading: true, error: null })
                try {
                    const { error } = await supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: window.location.origin + '/reset-password',
                    })
                    if (error) throw error
                    set({ loading: false })
                } catch (error) {
                    set({
                        loading: false,
                        error: error instanceof Error ? error.message : 'Reset password failed',
                    })
                }
            },

            clearError: () => set({ error: null }),
        }),
        {
            name: 'attendly-auth',
            partialize: (state) => ({
                // Only persist session info, not loading/error states
                user: state.user,
                session: state.session,
            }),
        }
    )
)
