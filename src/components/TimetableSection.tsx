import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Clock, Calendar, Check, X, Minus, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAttendanceStore } from '@/stores/attendanceStore'
import { format, parse, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns'
import { useAuthStore } from '@/stores/authStore'
import { calculateBunkBuffer } from '@/hooks/useAttendance'

const DAYS = [
    { value: 1, label: 'Mon', full: 'Monday' },
    { value: 2, label: 'Tue', full: 'Tuesday' },
    { value: 3, label: 'Wed', full: 'Wednesday' },
    { value: 4, label: 'Thu', full: 'Thursday' },
    { value: 5, label: 'Fri', full: 'Friday' },
    { value: 6, label: 'Sat', full: 'Saturday' },
    { value: 0, label: 'Sun', full: 'Sunday' },
]

interface TimetableSectionProps {
    weekStart: Date
    onNextWeek: () => void
    onPrevWeek: () => void
    onJumpToToday: () => void
}

export function TimetableSection({ weekStart, onNextWeek, onPrevWeek, onJumpToToday }: TimetableSectionProps) {
    const {
        subjects,
        timetable,
        fetchTimetable,
        deleteTimetableEntry,
        markAttendance,
        deleteAttendanceLog,
        attendanceLogs,
        holidays,
        fetchHolidays,
        loading,
    } = useAttendanceStore()
    const { user } = useAuthStore()

    // Default to current day (or Monday if Sunday)
    const today = new Date().getDay()
    const [selectedDay, setSelectedDay] = useState(today === 0 ? 1 : today)
    const [entryFeedback, setEntryFeedback] = useState<Record<string, string>>({})
    const feedbackTimers = useRef<Record<string, number>>({})

    useEffect(() => {
        if (subjects.length > 0) {
            const subjectIds = subjects.map(s => s.id)
            fetchTimetable(subjectIds)
            if (user) fetchHolidays(user.id)
        }
    }, [subjects, fetchTimetable, fetchHolidays, user])

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

    const handleMarkFromSchedule = async (entryId: string, subjectId: string, status: 'present' | 'absent' | 'cancelled', existingLogId?: string, currentStatus?: 'present' | 'absent' | 'cancelled', dateStr?: string) => {
        if (!user || loading) return
        if (existingLogId && currentStatus === status) {
            const ok = await deleteAttendanceLog(existingLogId, user.id)
            flashEntryFeedback(entryId, ok ? 'Attendance cleared' : 'Could not update attendance')
            return
        }

        const ok = await markAttendance(subjectId, user.id, status, dateStr)
        const label = status === 'present' ? 'Present' : status === 'absent' ? 'Absent' : 'Cancelled'
        flashEntryFeedback(entryId, ok ? `Marked ${label}` : 'Could not mark attendance')
    }

    // Calculate date for selected day based on weekStart prop
    const dayOffset = selectedDay === 0 ? 6 : selectedDay - 1
    const selectedDate = addDays(weekStart, dayOffset)

    const holiday = holidays.find(h => isSameDay(parseISO(h.date), selectedDate))

    // Check if showing current week to conditionally show "Jump to Today"
    const isCurrentWeek = isSameDay(startOfWeek(new Date(), { weekStartsOn: 1 }), weekStart)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" />
                    Weekly Schedule
                    <span className="text-sm font-normal text-muted ml-2 hidden md:inline">
                        ({format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d')})
                    </span>
                </h2>

                <div className="flex items-center gap-3">
                    {!isCurrentWeek && (
                        <button
                            onClick={onJumpToToday}
                            className="text-xs px-3 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors font-medium"
                        >
                            Jump to Today
                        </button>
                    )}
                    <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/10 shadow-sm backdrop-blur-sm">
                        <button
                            onClick={onPrevWeek}
                            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white/70 hover:text-white transition-all active:scale-95"
                            title="Previous Week"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="w-px h-4 bg-white/10 mx-0.5" />
                        <button
                            onClick={onNextWeek}
                            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white/70 hover:text-white transition-all active:scale-95"
                            title="Next Week"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
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
                        {holiday ? (
                            <div className="flex flex-col items-center justify-center py-12 animate-in fade-in zoom-in-95 duration-500">
                                <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center mb-6 ring-4 ring-orange-500/20">
                                    <span className="text-3xl">🎉</span>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">{holiday.name}</h3>
                                <p className="text-muted mb-6">Enjoy your holiday! No classes scheduled.</p>
                                <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-muted">
                                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                                </div>
                            </div>
                        ) : (
                            // Combine scheduled classes and extra classes
                            (() => {
                                const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')
                                const usedLogIds = new Set<string>()

                                // 1. Map scheduled entries and try to attach existing logs
                                const scheduledItems = dayEntries.map(entry => {
                                    const subject = subjects.find(s => s.id === entry.subject_id)
                                    let associatedLog = undefined

                                    if (subject) {
                                        // Find a log for this subject on this day that hasn't been used yet
                                        // We sort by session_number (asc) to match schedule order roughly if sessions existed
                                        // Since we often only have one, it grabs that one.
                                        associatedLog = attendanceLogs
                                            .filter(l => l.subject_id === subject.id && l.marked_at === selectedDateStr && !usedLogIds.has(l.id))
                                            .sort((a, b) => (a.session_number || 1) - (b.session_number || 1))[0]

                                        if (associatedLog) {
                                            usedLogIds.add(associatedLog.id)
                                        }
                                    }

                                    return {
                                        type: 'scheduled' as const,
                                        data: entry,
                                        log: associatedLog // Pass the specific log we found
                                    }
                                })

                                // 2. Any remaining logs for this date are "Extra Classes"
                                const extraLogs = attendanceLogs.filter(log =>
                                    log.marked_at === selectedDateStr &&
                                    !usedLogIds.has(log.id)
                                )

                                // Extra entries
                                const extraItems = extraLogs.map(log => ({ type: 'extra' as const, data: log }))

                                const allItems = [...scheduledItems, ...extraItems]

                                if (allItems.length === 0) return (
                                    selectedDay === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 animate-in fade-in zoom-in-95 duration-500">
                                            <img
                                                src="/tenor.gif"
                                                alt="Sunday Vibes"
                                                className="rounded-2xl max-w-[280px] w-full object-cover shadow-2xl shadow-indigo-500/20 border border-white/10"
                                            />
                                            <p className="mt-6 text-indigo-200/60 font-medium">Touch some grass duh!</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20 text-muted">
                                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                                <Clock className="w-8 h-8 opacity-20" />
                                            </div>
                                            <p>No classes scheduled for {DAYS.find(d => d.value === selectedDay)?.full}</p>
                                            <p className="mt-4 text-xs text-indigo-400/60">
                                                Classes marked from Overview will appear here as Extra Classes
                                            </p>
                                        </div>
                                    )
                                )

                                return allItems.map((item) => {
                                    if (item.type === 'scheduled') {
                                        const entry = item.data as any
                                        const subject = subjects.find(s => s.id === entry.subject_id)
                                        if (!subject) return null

                                        // Use the pre-calculated log
                                        const existingLog = item.log as any
                                        const currentStatus = existingLog?.status
                                        const dateStr = format(selectedDate, 'yyyy-MM-dd')

                                        return (
                                            <div key={`scheduled-${entry.id}`} className="space-y-1">
                                                <div
                                                    className="group relative flex items-center gap-4 p-4 rounded-2xl bg-[#0F0F11] border border-white/5 hover:border-white/10 transition-colors"
                                                >
                                                    {/* Time Column */}
                                                    <div className="flex flex-col items-center min-w-[80px] text-center border-r border-white/5 pr-4">
                                                        <span className="text-white font-bold text-lg">{formatTime(entry.start_time)}</span>
                                                        <span className="text-xs text-muted uppercase tracking-wider">{formatTime(entry.end_time)}</span>
                                                    </div>

                                                    {/* Subject Info */}
                                                    <div className="flex-1 min-w-0 flex items-center justify-between gap-4 pr-4">
                                                        <div className="min-w-0">
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
                                                            <h3 className="text-white font-medium text-lg leading-tight truncate">{subject.name}</h3>
                                                        </div>

                                                        {/* Stats Pill */}
                                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 text-white/60 text-xs">
                                                                <span className="w-1 h-1 rounded-full bg-white/40" />
                                                                <span>{subject.percentage.toFixed(1)}%</span>
                                                            </div>
                                                            {(() => {
                                                                const total = subject.present + subject.absent
                                                                const bunkBuffer = calculateBunkBuffer(subject.present, total, subject.min_attendance_req)
                                                                const isLow = subject.percentage < subject.min_attendance_req

                                                                return (
                                                                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs ${isLow ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
                                                                        }`}>
                                                                        <span className={`w-1 h-1 rounded-full ${isLow ? 'bg-red-400' : 'bg-green-400'}`} />
                                                                        <span className="font-mono">{bunkBuffer < 0 ? `need ${Math.abs(bunkBuffer)}` : `${bunkBuffer} buffer`}</span>
                                                                    </div>
                                                                )
                                                            })()}
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => handleMarkFromSchedule(entry.id, subject.id, 'present', existingLog?.id, currentStatus, dateStr)}
                                                                disabled={loading}
                                                                className={`p-2 rounded-lg transition-colors ${currentStatus === 'present'
                                                                    ? 'bg-green-500 text-white'
                                                                    : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                                                                    }`}
                                                                title={`Mark present (${format(selectedDate, 'MMM d')})`}
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleMarkFromSchedule(entry.id, subject.id, 'absent', existingLog?.id, currentStatus, dateStr)}
                                                                disabled={loading}
                                                                className={`p-2 rounded-lg transition-colors ${currentStatus === 'absent'
                                                                    ? 'bg-red-500 text-white'
                                                                    : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                                                    }`}
                                                                title={`Mark absent (${format(selectedDate, 'MMM d')})`}
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleMarkFromSchedule(entry.id, subject.id, 'cancelled', existingLog?.id, currentStatus, dateStr)}
                                                                disabled={loading}
                                                                className={`p-2 rounded-lg transition-colors ${currentStatus === 'cancelled'
                                                                    ? 'bg-yellow-500 text-white'
                                                                    : 'bg-white/5 text-muted hover:bg-white/10'
                                                                    }`}
                                                                title={`Mark cancelled (${format(selectedDate, 'MMM d')})`}
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
                                    } else {
                                        // Extra Class
                                        const log = item.data as any
                                        const subject = subjects.find(s => s.id === log.subject_id)
                                        if (!subject) return null

                                        return (
                                            <div key={`extra-${log.id}`} className="space-y-1">
                                                <div
                                                    className="group relative flex items-center gap-4 p-4 rounded-2xl bg-[#0F0F11]/50 border border-indigo-500/20 hover:border-indigo-500/40 transition-colors"
                                                >
                                                    {/* Time Column (Extra Class Indicator) */}
                                                    <div className="flex flex-col items-center min-w-[80px] text-center border-r border-white/5 pr-4 text-indigo-400">
                                                        <span className="text-xs font-bold uppercase tracking-wider">Extra</span>
                                                        <span className="text-[10px] opacity-60">Class</span>
                                                    </div>

                                                    {/* Subject Info */}
                                                    <div className="flex-1 min-w-0 flex items-center justify-between gap-4 pr-4">
                                                        <div className="min-w-0">
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
                                                            <h3 className="text-white font-medium text-lg leading-tight truncate">{subject.name}</h3>
                                                        </div>

                                                        {/* Status Pill */}
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${log.status === 'present' ? 'bg-green-500/20 text-green-400' :
                                                                log.status === 'absent' ? 'bg-red-500/20 text-red-400' :
                                                                    'bg-white/10 text-muted'
                                                                }`}>
                                                                {log.status}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Actions (Delete only) */}
                                                    <button
                                                        onClick={async () => {
                                                            if (confirm('Remove this extra class log?')) {
                                                                await deleteAttendanceLog(log.id, user!.id)
                                                            }
                                                        }}
                                                        className="p-2 hover:bg-white/10 rounded-lg text-muted hover:text-white transition-all"
                                                        title="Remove extra class"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    }
                                })
                            })()
                        )}

                    </motion.div>
                </AnimatePresence>
            </div>

        </div>
    )
}
