import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2, PartyPopper } from 'lucide-react'
import { useAttendanceStore } from '@/stores/attendanceStore'
import { useAuthStore } from '@/stores/authStore'
import { format, parseISO } from 'date-fns'

interface HolidaysModalProps {
    isOpen: boolean
    onClose: () => void
}

export function HolidaysModal({ isOpen, onClose }: HolidaysModalProps) {
    const { user } = useAuthStore()
    const { holidays, fetchHolidays, addHoliday, deleteHoliday, loading } = useAttendanceStore()
    const [name, setName] = useState('')
    const [date, setDate] = useState('')

    useEffect(() => {
        if (isOpen && user) {
            fetchHolidays(user.id)
        }
    }, [isOpen, user, fetchHolidays])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !name || !date) return

        await addHoliday({
            user_id: user.id,
            name,
            date,
        })
        setName('')
        setDate('')
    }

    const handleDelete = async (id: string) => {
        if (confirm('Delete this holiday?')) {
            await deleteHoliday(id)
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
                                    <PartyPopper className="w-5 h-5 text-orange-400" />
                                    Manage Holidays
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            placeholder="Holiday Name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="input bg-white/5 border-white/10 focus:bg-white/10 rounded-xl"
                                            required
                                        />
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="input bg-white/5 border-white/10 focus:bg-white/10 rounded-xl [color-scheme:dark]"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn btn-primary w-full h-10 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Holiday
                                    </button>
                                </form>

                                {/* List */}
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-muted uppercase tracking-wider">Upcoming Holidays</h3>
                                    {holidays.length === 0 ? (
                                        <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                                            <p className="text-muted text-sm">No holidays added yet.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {holidays.map((holiday) => (
                                                <div
                                                    key={holiday.id}
                                                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group hover:border-white/10 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 font-bold text-xs flex-col leading-none">
                                                            <span>{format(parseISO(holiday.date), 'dd')}</span>
                                                            <span className="text-[10px] opacity-70">{format(parseISO(holiday.date), 'MMM')}</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-medium text-sm">{holiday.name}</p>
                                                            <p className="text-muted text-xs">{format(parseISO(holiday.date), 'EEEE, MMMM d, yyyy')}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDelete(holiday.id)}
                                                        className="p-2 text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/5 rounded-lg"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
