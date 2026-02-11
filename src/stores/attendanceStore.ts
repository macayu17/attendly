import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import type { Subject, AttendanceLog, TimetableEntry, Holiday, Event } from '@/lib/database.types'

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
    holidays: Holiday[]
    events: Event[]
    semesterSettings: {
        startDate: string | null
        endDate: string | null
    }

    // UI State
    loading: boolean
    error: string | null

    // Actions
    fetchSubjects: (userId: string) => Promise<void>
    fetchAttendanceLogs: (userId: string) => Promise<void>
    fetchTimetable: (subjectIds: string[]) => Promise<void>
    fetchEvents: (userId: string) => Promise<void>

    addSubject: (subject: Omit<Subject, 'id' | 'created_at'>) => Promise<void>
    updateSubject: (id: string, updates: Partial<Subject>) => Promise<void>
    deleteSubject: (id: string) => Promise<void>

    addTimetableEntry: (entry: Omit<TimetableEntry, 'id'>) => Promise<void>
    deleteTimetableEntry: (id: string) => Promise<void>


    addHoliday: (holiday: Omit<Holiday, 'id' | 'created_at'>) => Promise<void>
    deleteHoliday: (id: string) => Promise<void>
    fetchHolidays: (userId: string) => Promise<void>

    addEvent: (event: Omit<Event, 'id' | 'created_at'>) => Promise<void>
    deleteEvent: (id: string) => Promise<void>

    setSemesterSettings: (settings: { startDate: string | null, endDate: string | null }) => void

    markAttendance: (subjectId: string, userId: string, status: 'present' | 'absent' | 'cancelled', date?: string, sessionNumber?: number) => Promise<boolean>
    deleteAttendanceLog: (logId: string) => Promise<boolean>

    clearError: () => void
    reset: () => void
}

const initialState = {
    subjects: [],
    timetable: [],
    attendanceLogs: [],
    holidays: [],
    events: [],
    loading: false,
    error: null,
    semesterSettings: {
        startDate: null,
        endDate: null
    }
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

            fetchHolidays: async (userId: string) => {
                try {
                    const { data, error } = await supabase
                        .from('holidays')
                        .select('*')
                        .eq('user_id', userId)
                        .order('date', { ascending: true })

                    if (error) throw error
                    set({ holidays: data || [] })
                } catch (error) {
                    set({ error: (error as Error).message })
                }
            },

            addHoliday: async (holiday) => {
                set({ loading: true, error: null })
                try {
                    const { data, error } = await supabase
                        .from('holidays')
                        .insert(holiday)
                        .select()
                        .single()

                    if (error) throw error

                    set((state) => ({
                        holidays: [...state.holidays, data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
                        loading: false,
                    }))
                } catch (error) {
                    set({ error: (error as Error).message, loading: false })
                }
            },

            deleteHoliday: async (id) => {
                set({ loading: true, error: null })
                try {
                    const { error } = await supabase
                        .from('holidays')
                        .delete()
                        .eq('id', id)

                    if (error) throw error

                    set((state) => ({
                        holidays: state.holidays.filter((h) => h.id !== id),
                        loading: false,
                    }))
                } catch (error) {
                    set({ error: (error as Error).message, loading: false })
                }
            },

            fetchEvents: async (userId: string) => {
                try {
                    const { data, error } = await supabase
                        .from('events')
                        .select('*')
                        .eq('user_id', userId)
                        .order('start_date', { ascending: true })

                    if (error) throw error
                    set({ events: data || [] })
                } catch (error) {
                    set({ error: (error as Error).message })
                }
            },

            addEvent: async (event) => {
                set({ loading: true, error: null })
                try {
                    const { data, error } = await supabase
                        .from('events')
                        .insert(event)
                        .select()
                        .single()

                    if (error) throw error

                    set((state) => ({
                        events: [...state.events, data].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()),
                        loading: false,
                    }))
                } catch (error) {
                    set({ error: (error as Error).message, loading: false })
                }
            },

            deleteEvent: async (id) => {
                set({ loading: true, error: null })
                try {
                    const { error } = await supabase
                        .from('events')
                        .delete()
                        .eq('id', id)

                    if (error) throw error

                    set((state) => ({
                        events: state.events.filter((e) => e.id !== id),
                        loading: false,
                    }))
                } catch (error) {
                    set({ error: (error as Error).message, loading: false })
                }
            },

            setSemesterSettings: (settings) => {
                set({ semesterSettings: settings })
            },

            markAttendance: async (subjectId, userId, status, date, sessionNumber = 1) => {
                const markedAt = date || new Date().toISOString().split('T')[0]

                try {
                    let updatedLog: AttendanceLog

                    // Check if already marked for this date AND session
                    const { data: existing } = await supabase
                        .from('attendance_logs')
                        .select('*')
                        .eq('subject_id', subjectId)
                        .eq('marked_at', markedAt)
                        .eq('session_number', sessionNumber)
                        .single()

                    if (existing) {
                        // Update existing
                        const { data, error } = await supabase
                            .from('attendance_logs')
                            .update({ status })
                            .eq('id', existing.id)
                            .select()
                            .single()

                        if (error) throw error
                        updatedLog = data
                    } else {
                        // Insert new
                        const { data, error } = await supabase
                            .from('attendance_logs')
                            .insert({
                                subject_id: subjectId,
                                user_id: userId,
                                status,
                                marked_at: markedAt,
                                session_number: sessionNumber,
                            })
                            .select()
                            .single()

                        if (error) throw error
                        updatedLog = data
                    }

                    // Update local state directly without refetching
                    set((state) => {
                        // 1. Update attendanceLogs
                        const newLogs = existing
                            ? state.attendanceLogs.map(l => l.id === existing.id ? updatedLog : l)
                            : [...state.attendanceLogs, updatedLog]

                        // 2. Update subject stats
                        const subjectLogs = newLogs.filter(l => l.subject_id === subjectId)
                        const present = subjectLogs.filter(l => l.status === 'present').length
                        const absent = subjectLogs.filter(l => l.status === 'absent').length
                        const cancelled = subjectLogs.filter(l => l.status === 'cancelled').length
                        const total = present + absent
                        const percentage = total > 0 ? (present / total) * 100 : 0

                        const newSubjects = state.subjects.map(s =>
                            s.id === subjectId
                                ? { ...s, present, absent, cancelled, percentage }
                                : s
                        )

                        return {
                            attendanceLogs: newLogs,
                            subjects: newSubjects,
                            loading: false
                        }
                    })

                    return true
                } catch (error) {
                    set({ error: (error as Error).message, loading: false })
                    return false
                }
            },

            deleteAttendanceLog: async (logId) => {
                // set({ loading: true, error: null }) // Optional: skip loading state for cleaner UI
                try {
                    // Get the log before deleting to know which subject to update (if needed)
                    // Or just use the logId to find it in current state
                    const logToDelete = get().attendanceLogs.find(l => l.id === logId)
                    if (!logToDelete) return false // Already gone?

                    const { error } = await supabase
                        .from('attendance_logs')
                        .delete()
                        .eq('id', logId)

                    if (error) throw error

                    // Update local state
                    set((state) => {
                        const newLogs = state.attendanceLogs.filter(l => l.id !== logId)
                        const subjectId = logToDelete.subject_id

                        // Recalculate stats for the subject
                        const subjectLogs = newLogs.filter(l => l.subject_id === subjectId)
                        const present = subjectLogs.filter(l => l.status === 'present').length
                        const absent = subjectLogs.filter(l => l.status === 'absent').length
                        const cancelled = subjectLogs.filter(l => l.status === 'cancelled').length
                        const total = present + absent
                        const percentage = total > 0 ? (present / total) * 100 : 0

                        const newSubjects = state.subjects.map(s =>
                            s.id === subjectId
                                ? { ...s, present, absent, cancelled, percentage }
                                : s
                        )

                        return {
                            attendanceLogs: newLogs,
                            subjects: newSubjects,
                            loading: false
                        }
                    })

                    return true
                } catch (error) {
                    set({ error: (error as Error).message, loading: false })
                    return false
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
                holidays: state.holidays,
                events: state.events,
                semesterSettings: state.semesterSettings,
            }),
        }
    )
)

