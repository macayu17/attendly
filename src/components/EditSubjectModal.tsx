import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Palette } from 'lucide-react'
import { useAttendanceStore } from '@/stores/attendanceStore'

interface EditSubjectModalProps {
    isOpen: boolean
    onClose: () => void
    subject: {
        id: string
        name: string
        code: string | null
        color_code: string
        min_attendance_req: number
        credits?: number
    } | null
}

const PRESET_COLORS = [
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#a855f7', // Purple
    '#d946ef', // Fuchsia
    '#ec4899', // Pink
    '#f43f5e', // Rose
    '#ef4444', // Red
    '#f97316', // Orange
    '#f59e0b', // Amber
    '#eab308', // Yellow
    '#84cc16', // Lime
    '#22c55e', // Green
    '#10b981', // Emerald
    '#14b8a6', // Teal
    '#06b6d4', // Cyan
    '#0ea5e9', // Sky
    '#3b82f6', // Blue
]

export function EditSubjectModal({ isOpen, onClose, subject }: EditSubjectModalProps) {
    const { updateSubject, loading } = useAttendanceStore()

    const [name, setName] = useState('')
    const [code, setCode] = useState('')
    const [colorCode, setColorCode] = useState('#6366f1')
    const [minAttendance, setMinAttendance] = useState(75)
    const [credits, setCredits] = useState(3)

    // Sync state when subject changes
    useEffect(() => {
        if (subject) {
            setName(subject.name)
            setCode(subject.code || '')
            setColorCode(subject.color_code)
            setMinAttendance(subject.min_attendance_req)
            setCredits(subject.credits || 3)
        }
    }, [subject])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!subject) return

        await updateSubject(subject.id, {
            name: name.trim(),
            code: code.trim() || null,
            color_code: colorCode,
            min_attendance_req: minAttendance,
            credits,
        })

        onClose()
    }

    if (!subject) return null

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ duration: 0.3, type: "spring", damping: 25 }}
                        className="relative w-full max-w-md overflow-hidden rounded-3xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-2xl" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <div className="absolute inset-[1px] rounded-3xl border border-white/10" />

                        <form onSubmit={handleSubmit} className="relative p-8">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: colorCode }}
                                    />
                                    <h2 className="text-xl font-bold text-white">Edit Subject</h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                                >
                                    <X className="w-5 h-5 text-white/60" />
                                </button>
                            </div>

                            {/* Name */}
                            <div className="mb-4">
                                <label className="block text-sm text-white/60 mb-2">Subject Name *</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
                                    placeholder="e.g., Data Structures"
                                />
                            </div>

                            {/* Code */}
                            <div className="mb-4">
                                <label className="block text-sm text-white/60 mb-2">Subject Code</label>
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
                                    placeholder="e.g., CS201"
                                />
                            </div>

                            {/* Min Attendance */}
                            <div className="mb-6">
                                <label className="block text-sm text-white/60 mb-2">
                                    Minimum Attendance: <span className="text-white font-semibold">{minAttendance}%</span>
                                </label>
                                <input
                                    type="range"
                                    min="50"
                                    max="100"
                                    value={minAttendance}
                                    onChange={(e) => setMinAttendance(Number(e.target.value))}
                                    className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-white"
                                />
                                <div className="flex justify-between text-xs text-white/30 mt-1">
                                    <span>50%</span>
                                    <span>75%</span>
                                    <span>100%</span>
                                </div>
                            </div>

                            {/* Credits */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm text-white/60">Credits</label>
                                    <span className="text-white font-semibold">{credits}</span>
                                </div>
                                <div className="flex gap-2">
                                    {[0, 1, 2, 3, 4].map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setCredits(c)}
                                            className={`flex-1 py-2 rounded-lg transition-all ${credits === c
                                                ? 'bg-white/20 text-white'
                                                : 'bg-white/5 text-white/50 hover:bg-white/10'
                                                }`}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Color Picker */}
                            <div className="mb-6">
                                <label className="flex items-center gap-2 text-sm text-white/60 mb-3">
                                    <Palette className="w-4 h-4" />
                                    Color
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {PRESET_COLORS.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setColorCode(color)}
                                            className={`w-8 h-8 rounded-lg transition-all ${colorCode === color
                                                ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110'
                                                : 'hover:scale-105'
                                                }`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                                {/* Custom color input */}
                                <div className="flex items-center gap-3 mt-3">
                                    <input
                                        type="color"
                                        value={colorCode}
                                        onChange={(e) => setColorCode(e.target.value)}
                                        className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                                    />
                                    <input
                                        type="text"
                                        value={colorCode}
                                        onChange={(e) => setColorCode(e.target.value)}
                                        className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-white/30"
                                        placeholder="#6366f1"
                                    />
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading || !name.trim()}
                                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
