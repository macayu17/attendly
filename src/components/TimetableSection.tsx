import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Clock, Calendar, Check, X, Minus } from 'lucide-react'
import { useAttendanceStore } from '@/stores/attendanceStore'
import { AddClassModal } from './AddClassModal'
import { format, parse } from 'date-fns'
import { useAuthStore } from '@/stores/authStore'

const DAYS = [
    { value: 1, label: 'Mon', full: 'Monday' },
    { value: 2, label: 'Tue', full: 'Tuesday' },
    { value: 3, label: 'Wed', full: 'Wednesday' },
    { value: 4, label: 'Thu', full: 'Thursday' },
    { value: 5, label: 'Fri', full: 'Friday' },
    { value: 6, label: 'Sat', full: 'Saturday' },
    { value: 0, label: 'Sun', full: 'Sunday' },
]

export function TimetableSection() {
    const {
        subjects,
        timetable,
        fetchTimetable,
        deleteTimetableEntry,
        markAttendance,
        deleteAttendanceLog,
        attendanceLogs,
        loading,
    } = useAttendanceStore()
    const { user } = useAuthStore()

    // Default to current day (or Monday if Sunday)
    const today = new Date().getDay()
    const todayDateString = new Date().toISOString().split('T')[0]
    const [selectedDay, setSelectedDay] = useState(today === 0 ? 1 : today)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [entryFeedback, setEntryFeedback] = useState<Record<string, string>>({})
    const feedbackTimers = useRef<Record<string, number>>({})

    useEffect(() => {
        if (subjects.length > 0) {
            const subjectIds = subjects.map(s => s.id)
            fetchTimetable(subjectIds)
        }
    }, [subjects, fetchTimetable])

    useEffect(() => {
        return () => {
            Object.values(feedbackTimers.current).forEach((timerId) => {
                window.clearTimeout(timerId)
            })
        }
    }, [])

    // Filter and Sort entries for selected day
    const dayEntries = timetable
        .filter(t => t.day_of_week === selectedDay)
        .sort((a, b) => a.start_time.localeCompare(b.start_time))

    // Helper to format time (09:00:00 -> 9:00 AM)
    const formatTime = (timeStr: string) => {
        try {
            // Append dummy date to parse time
            const date = parse(timeStr, 'HH:mm:ss', new Date())
            return format(date, 'h:mm a')
        } catch (e) {
            return timeStr.substring(0, 5)
        }
    }

    const handleDelete = async (id: string) => {
        if (confirm('Remove this class from schedule?')) {
            await deleteTimetableEntry(id)
        }
    }

    const flashEntryFeedback = (entryId: string, text: string) => {
        setEntryFeedback((prev) => ({ ...prev, [entryId]: text }))
        const existingTimer = feedbackTimers.current[entryId]
        if (existingTimer) {
            window.clearTimeout(existingTimer)
        }
        feedbackTimers.current[entryId] = window.setTimeout(() => {
            setEntryFeedback((prev) => {
                const next = { ...prev }
                delete next[entryId]
                return next
            })
            delete feedbackTimers.current[entryId]
        }, 2000)
    }

    const handleMarkFromSchedule = async (entryId: string, subjectId: string, status: 'present' | 'absent' | 'cancelled', existingLogId?: string, currentStatus?: 'present' | 'absent' | 'cancelled') => {
        if (!user || loading) return
        if (existingLogId && currentStatus === status) {
            const ok = await deleteAttendanceLog(existingLogId, user.id)
            flashEntryFeedback(entryId, ok ? 'Attendance cleared' : 'Could not update attendance')
            return
        }

        const ok = await markAttendance(subjectId, user.id, status)
        const label = status === 'present' ? 'Present' : status === 'absent' ? 'Absent' : 'Cancelled'
        flashEntryFeedback(entryId, ok ? `Marked ${label}` : 'Could not mark attendance')
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" />
                    Weekly Schedule
                </h2>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="btn btn-primary h-10 px-4 rounded-full text-sm flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Class
                </button>
            </div>

            {/* Day Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide snap-x">
                {DAYS.map(day => (
                    <button
                        key={day.value}
                        onClick={() => setSelectedDay(day.value)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all snap-center ${selectedDay === day.value
                            ? 'bg-white text-black shadow-lg shadow-white/10'
                            : 'bg-white/5 text-muted hover:bg-white/10'
                            }`}
                    >
                        {day.label}
                    </button>
                ))}
            </div>

            {/* Schedule List */}
            <div className="min-h-[300px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={selectedDay}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-3"
                    >
                        {dayEntries.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-muted">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                    <Clock className="w-8 h-8 opacity-20" />
                                </div>
                                <p>No classes scheduled for {DAYS.find(d => d.value === selectedDay)?.full}</p>
                                <button
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                                >
                                    + Add a class
                                </button>
                            </div>
                        ) : (
                            dayEntries.map(entry => {
                                const subject = subjects.find(s => s.id === entry.subject_id)
                                if (!subject) return null
                                const existingLog = attendanceLogs.find(
                                    (log) => log.subject_id === subject.id && log.marked_at === todayDateString
                                )
                                const currentStatus = existingLog?.status

                                return (
                                    <div key={entry.id} className="space-y-1">
                                        <div
                                            className="group relative flex items-center gap-4 p-4 rounded-2xl bg-[#0F0F11] border border-white/5 hover:border-white/10 transition-colors"
                                        >
                                            {/* Time Column */}
                                            <div className="flex flex-col items-center min-w-[80px] text-center border-r border-white/5 pr-4">
                                                <span className="text-white font-bold text-lg">{formatTime(entry.start_time)}</span>
                                                <span className="text-xs text-muted uppercase tracking-wider">{formatTime(entry.end_time)}</span>
                                            </div>

                                            {/* Subject Info */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div
                                                        className="w-2 h-2 rounded-full"
                                                        style={{ background: subject.color_code }}
                                                    />
                                                    <span
                                                        className="text-xs font-bold px-2 py-0.5 rounded-md uppercase tracking-wider"
                                                        style={{ background: `${subject.color_code}20`, color: subject.color_code }}
                                                    >
                                                        {subject.code || 'SUB'}
                                                    </span>
                                                </div>
                                                <h3 className="text-white font-medium text-lg leading-tight">{subject.name}</h3>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleMarkFromSchedule(entry.id, subject.id, 'present', existingLog?.id, currentStatus)}
                                                        disabled={loading}
                                                        className={`p-2 rounded-lg transition-colors ${currentStatus === 'present'
                                                            ? 'bg-green-500 text-white'
                                                            : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                                                            }`}
                                                        title="Mark present (today)"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleMarkFromSchedule(entry.id, subject.id, 'absent', existingLog?.id, currentStatus)}
                                                        disabled={loading}
                                                        className={`p-2 rounded-lg transition-colors ${currentStatus === 'absent'
                                                            ? 'bg-red-500 text-white'
                                                            : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                                            }`}
                                                        title="Mark absent (today)"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleMarkFromSchedule(entry.id, subject.id, 'cancelled', existingLog?.id, currentStatus)}
                                                        disabled={loading}
                                                        className={`p-2 rounded-lg transition-colors ${currentStatus === 'cancelled'
                                                            ? 'bg-yellow-500 text-white'
                                                            : 'bg-white/5 text-muted hover:bg-white/10'
                                                            }`}
                                                        title="Mark cancelled (today)"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => handleDelete(entry.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 rounded-lg text-muted hover:text-red-400 transition-all"
                                                    title="Remove class"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        {entryFeedback[entry.id] && (
                                            <div className="pt-1 text-xs text-white/50">
                                                {entryFeedback[entry.id]}
                                            </div>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            <AddClassModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
            />
        </div>
    )
}
