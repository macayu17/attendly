import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import type { Subject, AttendanceLog, TimetableEntry } from '@/lib/database.types'

interface SubjectWithStats extends Subject {
    present: number
    absent: number
    cancelled: number
    percentage: number
}

interface AttendanceState {
    // Data
    subjects: SubjectWithStats[]
    timetable: TimetableEntry[]
    attendanceLogs: AttendanceLog[]

    // UI State
    loading: boolean
    error: string | null

    // Actions
    fetchSubjects: (userId: string) => Promise<void>
    fetchAttendanceLogs: (userId: string) => Promise<void>
    fetchTimetable: (subjectIds: string[]) => Promise<void>

    addSubject: (subject: Omit<Subject, 'id' | 'created_at'>) => Promise<void>
    updateSubject: (id: string, updates: Partial<Subject>) => Promise<void>
    deleteSubject: (id: string) => Promise<void>

    addTimetableEntry: (entry: Omit<TimetableEntry, 'id'>) => Promise<void>
    deleteTimetableEntry: (id: string) => Promise<void>

    markAttendance: (subjectId: string, userId: string, status: 'present' | 'absent' | 'cancelled', date?: string, sessionNumber?: number) => Promise<void>
    deleteAttendanceLog: (logId: string) => Promise<void>

    clearError: () => void
    reset: () => void
}

const initialState = {
    subjects: [],
    timetable: [],
    attendanceLogs: [],
    loading: false,
    error: null,
}

export const useAttendanceStore = create<AttendanceState>()(
    persist(
        (set, get) => ({
            ...initialState,

            fetchSubjects: async (userId: string) => {
                if (!userId) {
                    set({ error: 'User ID is required', loading: false })
                    return
                }
                set({ loading: true, error: null })
                try {
                    const { data: subjects, error } = await supabase
                        .from('subjects')
                        .select('*')
                        .eq('user_id', userId)
                        .order('created_at', { ascending: false })

                    if (error) throw error

                    // Fetch attendance logs for all subjects
                    const { data: logs, error: logsError } = await supabase
                        .from('attendance_logs')
                        .select('*')
                        .eq('user_id', userId)

                    if (logsError) throw logsError

                    // Calculate stats for each subject
                    const subjectsWithStats: SubjectWithStats[] = (subjects || []).map((subject) => {
                        const subjectLogs = (logs || []).filter((log) => log.subject_id === subject.id)
                        const present = subjectLogs.filter((l) => l.status === 'present').length
                        const absent = subjectLogs.filter((l) => l.status === 'absent').length
                        const cancelled = subjectLogs.filter((l) => l.status === 'cancelled').length
                        const total = present + absent
                        const percentage = total > 0 ? (present / total) * 100 : 0

                        return {
                            ...subject,
                            present,
                            absent,
                            cancelled,
                            percentage,
                        }
                    })

                    set({
                        subjects: subjectsWithStats,
                        attendanceLogs: logs || [],
                        loading: false
                    })
                } catch (error) {
                    set({ error: (error as Error).message, loading: false })
                }
            },

            fetchAttendanceLogs: async (userId: string) => {
                try {
                    const { data, error } = await supabase
                        .from('attendance_logs')
                        .select('*')
                        .eq('user_id', userId)
                        .order('marked_at', { ascending: false })

                    if (error) throw error
                    set({ attendanceLogs: data || [] })
                } catch (error) {
                    set({ error: (error as Error).message })
                }
            },

            fetchTimetable: async (subjectIds: string[]) => {
                if (subjectIds.length === 0) {
                    set({ timetable: [] })
                    return
                }
                try {
                    const { data, error } = await supabase
                        .from('timetable')
                        .select('*')
                        .in('subject_id', subjectIds)

                    if (error) throw error
                    set({ timetable: data || [] })
                } catch (error) {
                    set({ error: (error as Error).message })
                }
            },

            addSubject: async (subject) => {
                set({ loading: true, error: null })
                try {
                    const { data, error } = await supabase
                        .from('subjects')
                        .insert(subject)
                        .select()
                        .single()

                    if (error) throw error

                    const newSubject: SubjectWithStats = {
                        ...data,
                        present: 0,
                        absent: 0,
                        cancelled: 0,
                        percentage: 0,
                    }

                    set((state) => ({
                        subjects: [newSubject, ...state.subjects],
                        loading: false,
                    }))
                } catch (error) {
                    set({ error: (error as Error).message, loading: false })
                }
            },

            updateSubject: async (id, updates) => {
                set({ loading: true, error: null })
                try {
                    const { error } = await supabase
                        .from('subjects')
                        .update(updates)
                        .eq('id', id)

                    if (error) throw error

                    set((state) => ({
                        subjects: state.subjects.map((s) =>
                            s.id === id ? { ...s, ...updates } : s
                        ),
                        loading: false,
                    }))
                } catch (error) {
                    set({ error: (error as Error).message, loading: false })
                }
            },

            deleteSubject: async (id) => {
                set({ loading: true, error: null })
                try {
                    const { error } = await supabase
                        .from('subjects')
                        .delete()
                        .eq('id', id)

                    if (error) throw error

                    set((state) => ({
                        subjects: state.subjects.filter((s) => s.id !== id),
                        loading: false,
                    }))
                } catch (error) {
                    set({ error: (error as Error).message, loading: false })
                }
            },

            addTimetableEntry: async (entry) => {
                set({ loading: true, error: null })
                try {
                    const { data, error } = await supabase
                        .from('timetable')
                        .insert(entry)
                        .select()
                        .single()

                    if (error) throw error

                    set((state) => ({
                        timetable: [...state.timetable, data],
                        loading: false,
                    }))
                } catch (error) {
                    set({ error: (error as Error).message, loading: false })
                }
            },

            deleteTimetableEntry: async (id) => {
                set({ loading: true, error: null })
                try {
                    const { error } = await supabase
                        .from('timetable')
                        .delete()
                        .eq('id', id)

                    if (error) throw error

                    set((state) => ({
                        timetable: state.timetable.filter((t) => t.id !== id),
                        loading: false,
                    }))
                } catch (error) {
                    set({ error: (error as Error).message, loading: false })
                }
            },

            markAttendance: async (subjectId, userId, status, date, sessionNumber = 1) => {
                set({ loading: true, error: null })
                const markedAt = date || new Date().toISOString().split('T')[0]

                try {
                    // Check if already marked for this date AND session
                    const { data: existing } = await supabase
                        .from('attendance_logs')
                        .select('id')
                        .eq('subject_id', subjectId)
                        .eq('marked_at', markedAt)
                        .eq('session_number', sessionNumber)
                        .single()

                    if (existing) {
                        // Update existing
                        const { error } = await supabase
                            .from('attendance_logs')
                            .update({ status })
                            .eq('id', existing.id)

                        if (error) throw error
                    } else {
                        // Insert new
                        const { error } = await supabase
                            .from('attendance_logs')
                            .insert({
                                subject_id: subjectId,
                                user_id: userId,
                                status,
                                marked_at: markedAt,
                                session_number: sessionNumber,
                            })

                        if (error) throw error
                    }

                    // Refresh subjects to get updated stats
                    await get().fetchSubjects(userId)
                } catch (error) {
                    set({ error: (error as Error).message, loading: false })
                }
            },

            deleteAttendanceLog: async (logId) => {
                set({ loading: true, error: null })
                try {
                    const { error } = await supabase
                        .from('attendance_logs')
                        .delete()
                        .eq('id', logId)

                    if (error) throw error

                    set((state) => ({
                        attendanceLogs: state.attendanceLogs.filter(l => l.id !== logId),
                        loading: false,
                    }))
                } catch (error) {
                    set({ error: (error as Error).message, loading: false })
                }
            },

            clearError: () => set({ error: null }),

            reset: () => set(initialState),
        }),
        {
            name: 'attendance-storage',
            partialize: (state) => ({
                // Only persist subjects and timetable, not logs (fetch fresh)
                subjects: state.subjects,
                timetable: state.timetable,
            }),
        }
    )
)
