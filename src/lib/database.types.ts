export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            subjects: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    code: string | null
                    color_code: string
                    min_attendance_req: number
                    credits: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    code?: string | null
                    color_code?: string
                    min_attendance_req?: number
                    credits?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    code?: string | null
                    color_code?: string
                    min_attendance_req?: number
                    credits?: number
                    created_at?: string
                }
            }
            timetable: {
                Row: {
                    id: string
                    subject_id: string
                    day_of_week: number
                    start_time: string
                    end_time: string
                }
                Insert: {
                    id?: string
                    subject_id: string
                    day_of_week: number
                    start_time: string
                    end_time: string
                }
                Update: {
                    id?: string
                    subject_id?: string
                    day_of_week?: number
                    start_time?: string
                    end_time?: string
                }
            }
            attendance_logs: {
                Row: {
                    id: string
                    subject_id: string
                    user_id: string
                    status: 'present' | 'absent' | 'cancelled'
                    marked_at: string
                    session_number: number
                }
                Insert: {
                    id?: string
                    subject_id: string
                    user_id: string
                    status: 'present' | 'absent' | 'cancelled'
                    marked_at?: string
                    session_number?: number
                }
                Update: {
                    id?: string
                    subject_id?: string
                    user_id?: string
                    status?: 'present' | 'absent' | 'cancelled'
                    marked_at?: string
                    session_number?: number
                }
            }
            events: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    start_date: string
                    end_date: string
                    event_type: 'exam' | 'event' | 'placement' | 'other'
                    description: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    start_date: string
                    end_date: string
                    event_type?: 'exam' | 'event' | 'placement' | 'other'
                    description?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    start_date?: string
                    end_date?: string
                    event_type?: 'exam' | 'event' | 'placement' | 'other'
                    description?: string | null
                    created_at?: string
                }
            }
            holidays: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    date: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    date: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    date?: string
                    created_at?: string
                }
            }
        }
        Views: Record<string, never>
        Functions: Record<string, never>
        Enums: Record<string, never>
    }
}

// Convenience types
export type Subject = Database['public']['Tables']['subjects']['Row']
export type TimetableEntry = Database['public']['Tables']['timetable']['Row']
export type AttendanceLog = Database['public']['Tables']['attendance_logs']['Row']
export type Event = Database['public']['Tables']['events']['Row']
export type Holiday = Database['public']['Tables']['holidays']['Row']
