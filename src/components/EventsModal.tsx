
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2, Calendar, BookOpen, Briefcase, PartyPopper } from 'lucide-react'
import { useAttendanceStore } from '@/stores/attendanceStore'
import { useAuthStore } from '@/stores/authStore'
import { format, parseISO } from 'date-fns'

interface EventsModalProps {
    isOpen: boolean
    onClose: () => void
}

const EVENT_TYPES = [
    { id: 'exam', label: 'Exam', icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { id: 'event', label: 'Event', icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { id: 'placement', label: 'Placement', icon: Briefcase, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { id: 'other', label: 'Other', icon: PartyPopper, color: 'text-orange-400', bg: 'bg-orange-500/10' },
] as const

export function EventsModal({ isOpen, onClose }: EventsModalProps) {
    const { user } = useAuthStore()
    const { events, fetchEvents, addEvent, deleteEvent, loading } = useAttendanceStore()
    const [name, setName] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [countsAttendance, setCountsAttendance] = useState(false)
    const [type, setType] = useState<typeof EVENT_TYPES[number]['id']>('event')

    useEffect(() => {
        if (isOpen && user) {
            fetchEvents(user.id)
        }
    }, [isOpen, user, fetchEvents])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !name || !startDate || !endDate) return

        if (endDate < startDate) {
            alert('End date must be after or equal to start date')
            return
        }

        await addEvent({
            user_id: user.id,
            name,
            start_date: startDate,
            end_date: endDate,
            end_date: endDate,
            event_type: type,
            counts_attendance: countsAttendance,
            description: null
        })
        setName('')
        setStartDate('')
        setEndDate('')
        setCountsAttendance(false)
        setType('event')
    }

    const handleDelete = async (id: string) => {
        if (confirm('Delete this event?')) {
            await deleteEvent(id)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4"
                    >
                        <div className="w-full max-w-md bg-[#0F0F11] border border-white/10 rounded-2xl shadow-2xl pointer-events-auto overflow-hidden flex flex-col max-h-[80vh]">
                            {/* Header */}
                            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-indigo-400" />
                                    Manage Events & Exams
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-muted hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-4 overflow-y-auto flex-1 space-y-6">
                                {/* Add Form */}
                                <form onSubmit={handleSubmit} className="space-y-3">
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="Event Name (e.g. Mid-Term Exams)"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="input w-full bg-white/5 border-white/10 focus:bg-white/10 rounded-xl"
                                            required
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        {EVENT_TYPES.map(t => (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => setType(t.id)}
                                                className={`flex-1 p-2 rounded-xl text-xs font-medium border transition-all ${type === t.id
                                                    ? `${t.bg} ${t.color} border-${t.color.split('-')[1]}-500/50`
                                                    : 'bg-white/5 border-transparent text-muted hover:bg-white/10'
                                                    }`}
                                            >
                                                <div className="flex flex-col items-center gap-1">
                                                    <t.icon className="w-4 h-4" />
                                                    {t.label}
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <span className="text-xs text-muted ml-1">Start Date</span>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="input w-full bg-white/5 border-white/10 focus:bg-white/10 rounded-xl [color-scheme:dark]"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs text-muted ml-1">End Date</span>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="input w-full bg-white/5 border-white/10 focus:bg-white/10 rounded-xl [color-scheme:dark]"
                                                required
                                            />
                                        </div>
                                    </div>
                            </div>

                            <div className="flex items-center gap-2 px-1">
                                <input
                                    type="checkbox"
                                    id="countsAttendance"
                                    checked={countsAttendance}
                                    onChange={(e) => setCountsAttendance(e.target.checked)}
                                    className="w-4 h-4 rounded border-white/10 bg-white/5 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                                />
                                <label htmlFor="countsAttendance" className="text-sm text-muted cursor-pointer select-none">
                                    Count attendance during this event?
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary w-full h-10 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add Event
                            </button>
                        </form>

                        {/* List */}
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-muted uppercase tracking-wider">Upcoming Events</h3>
                            {events.length === 0 ? (
                                <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                                    <p className="text-muted text-sm">No events added yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {events.map((event) => {
                                        const typeConfig = EVENT_TYPES.find(t => t.id === event.event_type) || EVENT_TYPES[1]
                                        const Icon = typeConfig.icon
                                        return (
                                            <div
                                                key={event.id}
                                                className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group hover:border-white/10 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl ${typeConfig.bg} flex items-center justify-center ${typeConfig.color}`}>
                                                        <Icon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-medium text-sm">{event.name}</p>
                                                        <p className="text-muted text-xs">
                                                            {format(parseISO(event.start_date), 'MMM d')} - {format(parseISO(event.end_date), 'MMM d, yyyy')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDelete(event.id)}
                                                    className="p-2 text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/5 rounded-lg"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
        </motion.div>
                </>
            )
}
        </AnimatePresence >
    )
}
