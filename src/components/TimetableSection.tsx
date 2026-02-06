import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Clock, Calendar } from 'lucide-react'
import { useAttendanceStore } from '@/stores/attendanceStore'
import { AddClassModal } from './AddClassModal'
import { format, parse } from 'date-fns'

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
    } = useAttendanceStore()

    // Default to current day (or Monday if Sunday)
    const today = new Date().getDay()
    const [selectedDay, setSelectedDay] = useState(today === 0 ? 1 : today)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)

    useEffect(() => {
        if (subjects.length > 0) {
            const subjectIds = subjects.map(s => s.id)
            fetchTimetable(subjectIds)
        }
    }, [subjects, fetchTimetable])

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

                                return (
                                    <div
                                        key={entry.id}
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
                                        <button
                                            onClick={() => handleDelete(entry.id)}
                                            className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 rounded-lg text-muted hover:text-red-400 transition-all"
                                            title="Remove class"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
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
