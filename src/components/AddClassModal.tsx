import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Calendar, Clock } from 'lucide-react'
import { useAttendanceStore } from '@/stores/attendanceStore'

interface AddClassModalProps {
    isOpen: boolean
    onClose: () => void
}

const DAYS = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
    { value: 0, label: 'Sunday' },
]

export function AddClassModal({ isOpen, onClose }: AddClassModalProps) {
    const { subjects, addTimetableEntry, loading, error, clearError } = useAttendanceStore()

    const [selectedSubjectId, setSelectedSubjectId] = useState('')
    const [day, setDay] = useState(1) // Monday default
    const [startTime, setStartTime] = useState('09:00')
    const [endTime, setEndTime] = useState('10:00')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedSubjectId) return

        await addTimetableEntry({
            subject_id: selectedSubjectId,
            day_of_week: day,
            start_time: startTime,
            end_time: endTime,
        })

        if (!error) {
            handleClose()
        }
    }

    const handleClose = () => {
        clearError()
        setSelectedSubjectId('')
        setDay(1)
        setStartTime('09:00')
        setEndTime('10:00')
        onClose()
    }

    // Get color of selected subject
    const selectedSubject = subjects.find(s => s.id === selectedSubjectId)
    const accentColor = selectedSubject?.color_code || '#6366f1'

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={handleClose}
                >
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden shadow-xl"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-white">Add Class</h2>
                            </div>
                            <button onClick={handleClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                <X className="w-5 h-5 text-muted" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Subject Select */}
                            <div>
                                <label className="block text-sm font-medium text-muted mb-2">Subject</label>
                                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto scrollbar-hide">
                                    {subjects.map(subject => (
                                        <button
                                            key={subject.id}
                                            type="button"
                                            onClick={() => setSelectedSubjectId(subject.id)}
                                            className={`p-3 rounded-xl border text-left transition-all ${selectedSubjectId === subject.id
                                                ? 'bg-white/10 border-white/20'
                                                : 'bg-white/5 border-transparent hover:bg-white/[0.07]'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <div
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ background: subject.color_code }}
                                                />
                                                <span className="font-semibold text-white text-sm truncate">{subject.code || subject.name.substring(0, 3).toUpperCase()}</span>
                                            </div>
                                            <div className="text-xs text-muted truncate">{subject.name}</div>
                                        </button>
                                    ))}
                                </div>
                                {subjects.length === 0 && (
                                    <p className="text-sm text-red-400 mt-2">No subjects found. Add a subject first.</p>
                                )}
                            </div>

                            {/* Day Select */}
                            <div>
                                <label className="block text-sm font-medium text-muted mb-2">Day</label>
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {DAYS.map(d => (
                                        <button
                                            key={d.value}
                                            type="button"
                                            onClick={() => setDay(d.value)}
                                            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${day === d.value
                                                ? 'bg-white text-black font-semibold'
                                                : 'bg-white/5 text-muted hover:bg-white/10'
                                                }`}
                                        >
                                            {d.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Time */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted mb-2">Start Time</label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                                        <input
                                            type="time"
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 pl-10 py-3 text-white focus:outline-none focus:border-white/20"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted mb-2">End Time</label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                                        <input
                                            type="time"
                                            value={endTime}
                                            onChange={(e) => setEndTime(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 pl-10 py-3 text-white focus:outline-none focus:border-white/20"
                                        />
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !selectedSubjectId}
                                className="w-full py-4 rounded-xl font-bold text-black transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ background: selectedSubjectId ? accentColor : '#fff' }}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Adding...
                                    </span>
                                ) : 'Add to Schedule'}
                            </button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
