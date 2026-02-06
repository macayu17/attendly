import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Plus, RefreshCw, BookOpen, Home, TrendingUp, Calendar, Zap, History } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useAttendanceStore } from '@/stores/attendanceStore'
import { SubjectCard } from '@/components/SubjectCard'
import { AddSubjectModal } from '@/components/AddSubjectModal'
import { SettingsModal } from '@/components/SettingsModal'
import { AttendanceHistoryModal } from '@/components/AttendanceHistoryModal'
import { calculateBunkBuffer } from '@/hooks/useAttendance'
import Dock from '@/components/Dock'
import PillNav from '@/components/PillNav'
import { TimetableSection } from '@/components/TimetableSection'
import PixelBlast from '@/components/PixelBlast'

export function Dashboard() {
    const { user, signOut } = useAuthStore()
    const { subjects, loading, fetchSubjects, timetable } = useAttendanceStore()
    const [showAddModal, setShowAddModal] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [showHistory, setShowHistory] = useState(false)

    useEffect(() => {
        if (user) fetchSubjects(user.id)
    }, [user, fetchSubjects])

    // Calc Stats
    const totalPresent = subjects.reduce((sum, s) => sum + s.present, 0)
    const totalAbsent = subjects.reduce((sum, s) => sum + s.absent, 0)
    const totalClasses = totalPresent + totalAbsent
    const overallPercentage = totalClasses > 0 ? (totalPresent / totalClasses) * 100 : 0
    const overallBunkBuffer = calculateBunkBuffer(totalPresent, totalClasses, 75)

    // Date
    // Date
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const today = currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })


    const hour = currentTime.getHours()

    // Fun hourly greetings - different for each hour!
    const hourlyGreetings: Record<number, string> = {
        0: "Still Awake?",
        1: "Night Owl Mode",
        2: "Sleep is Overrated",
        3: "3 AM Thoughts",
        4: "Early Bird?",
        5: "Rise & Grind",
        6: "Fresh Start",
        7: "Wakey Wakey",
        8: "Let's Get It",
        9: "Coffee Time",
        10: "Mid-Morning",
        11: "Almost Lunch",
        12: "Noon O'Clock",
        13: "Post-Lunch Vibes",
        14: "Afternoon Hustle",
        15: "Tea Break?",
        16: "Golden Hour",
        17: "Almost Done",
        18: "Evening Mode",
        19: "Sunset Vibes",
        20: "Night Time",
        21: "Winding Down",
        22: "Late Night",
        23: "Burning Midnight Oil",
    }
    const greeting = hourlyGreetings[hour] || 'Hey There'

    // Calculate Next Class
    const nextClass = useMemo(() => {
        if (!timetable.length) return null

        const now = new Date()
        const currentDay = now.getDay()
        const currentMinutes = now.getHours() * 60 + now.getMinutes()

        // Filter for today's classes
        const todayClasses = timetable
            .filter(t => t.day_of_week === currentDay)
            .map(t => {
                const [h, m] = t.start_time.split(':').map(Number)
                return { ...t, minutes: h * 60 + m }
            })
            .sort((a, b) => a.minutes - b.minutes)

        // Find next class
        const upcoming = todayClasses.find(t => t.minutes > currentMinutes)

        if (!upcoming) return null

        const subject = subjects.find(s => s.id === upcoming.subject_id)
        if (!subject) return null

        // Calculate time difference
        const diff = upcoming.minutes - currentMinutes
        const timeDisplay = diff < 60 ? `in ${diff} min` : `at ${upcoming.start_time.slice(0, 5)}`

        return { subject, timeDisplay }
    }, [timetable, subjects, currentTime])

    // Memoize nav items to prevent re-renders causing PillNav glitches
    const dockItems = useMemo(() => [
        {
            icon: <Home className="w-5 h-5 text-white" />,
            label: 'Home',
            onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' })
        },
        {
            icon: <Plus className="w-5 h-5 text-white" />,
            label: 'Add Subject',
            onClick: () => setShowAddModal(true)
        },
        {
            icon: <RefreshCw className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`} />,
            label: 'Refresh',
            onClick: () => user && fetchSubjects(user.id)
        },
        {
            icon: <History className="w-5 h-5 text-white" />,
            label: 'History',
            onClick: () => setShowHistory(true)
        },
        {
            icon: <div className="w-full h-full rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white uppercase">{user?.email?.charAt(0) || 'U'}</div>,
            label: 'Profile',
            onClick: () => setShowSettings(true)
        },
        {
            icon: <LogOut className="w-5 h-5 text-red-400" />,
            label: 'Sign Out',
            onClick: signOut
        }
    ], [user, loading, fetchSubjects, signOut])

    const navItems = useMemo(() => [
        { label: 'Overview', href: '#overview', onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
        { label: 'Subjects', href: '#subjects', onClick: () => document.getElementById('subjects-section')?.scrollIntoView({ behavior: 'smooth' }) },
        { label: 'Schedule', href: '#schedule', onClick: () => document.getElementById('schedule')?.scrollIntoView({ behavior: 'smooth' }) },
        { label: 'Settings', href: '#settings', onClick: () => setShowSettings(true) },
    ], [])

    return (
        <div className="min-h-screen bg-premium text-foreground pb-40">
            {/* PixelBlast Background - hidden on mobile for performance */}
            <div className="hidden md:block fixed inset-0 -z-10 pointer-events-none opacity-30">
                <PixelBlast
                    variant="circle"
                    pixelSize={4}
                    color="#6366f1"
                    patternScale={3}
                    patternDensity={0.4}
                    enableRipples={false}
                    edgeFade={0.5}
                    speed={0.1}
                />
            </div>

            {/* Navigation Area - Sticky, not overlapping content */}
            <div className="sticky top-0 z-50 pt-4 md:pt-6 pb-2 md:pb-4 relative">
                <div className="container flex items-center justify-between">
                    <PillNav
                        items={navItems}
                        logo="/logo.svg"
                        logoAlt="Attendly"
                        baseColor="#000"
                        pillColor="#0A0A0A"
                        pillTextColor="#888"
                        hoveredPillTextColor="#fff"
                    />

                    <div className="hidden md:block">
                        <div className="flex items-center gap-3 bg-[#0A0A0A] rounded-full px-5 py-2.5 border border-white/5">
                            <Calendar className="w-4 h-4 text-muted" />
                            <div className="text-right">
                                <p className="text-white font-medium text-sm leading-tight">{today}</p>
                                <p className="text-[10px] text-muted uppercase tracking-wider">
                                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} • {greeting}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Timetable Section */}
            <div id="schedule" className="container mb-24 md:mb-32 relative z-10">
                <TimetableSection />
            </div>

            {/* Hero Section with Welcome */}
            <div className="container pt-8 pb-16 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-12 md:mb-16"
                >
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 md:mb-3 tracking-tight leading-tight">
                        {greeting}, <span className="text-white/50 block md:inline">{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student'}</span>
                    </h1>
                    <div className="flex items-center gap-4 text-white/60 mb-2">
                        <p className="text-lg font-medium">{today}</p>
                        {nextClass && (
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm animate-in fade-in slide-in-from-left-4">
                                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: nextClass.subject.color_code }} />
                                <span className="text-white">Next: {nextClass.subject.name}</span>
                                <span className="text-white/40">{nextClass.timeDisplay}</span>
                            </div>
                        )}
                    </div>
                    <p className="text-muted text-lg">Track your attendance and BUNK smartly.</p>                </motion.div>

                {/* Stats Row */}
                <div id="overview" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                    {/* Main Stat Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="md:col-span-1 card p-8 flex flex-col justify-between relative overflow-hidden min-h-[200px] group hover:border-white/10 transition-colors"
                    >
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-purple-600/10 blur-3xl rounded-full pointer-events-none group-hover:scale-150 transition-transform duration-500" />
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-xs text-muted font-medium uppercase tracking-wider">Overall</span>
                        </div>
                        <div>
                            <span className="text-6xl font-bold text-white tracking-tighter block">
                                {totalClasses > 0 ? Math.round(overallPercentage) : '--'}%
                            </span>
                            {totalClasses > 0 && (
                                <span className={`inline-block mt-3 text-xs font-medium px-3 py-1.5 rounded-full ${overallPercentage >= 75 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                    {overallPercentage >= 75 ? '✓ On Track' : '! Needs Work'}
                                </span>
                            )}
                        </div>
                    </motion.div>

                    {/* Bunks Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="card p-8 flex flex-col justify-between min-h-[200px] group hover:border-white/10 transition-colors"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                <Zap className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-xs text-muted font-medium uppercase tracking-wider">Safe Bunks</span>
                        </div>
                        <div>
                            <span className="text-6xl font-bold text-white tracking-tighter">{overallBunkBuffer}</span>
                            <p className="text-muted text-sm mt-2">classes you can skip</p>
                        </div>
                    </motion.div>

                    {/* Classes Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="card p-8 flex flex-col justify-between min-h-[200px] group hover:border-white/10 transition-colors"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                <Calendar className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-xs text-muted font-medium uppercase tracking-wider">Attended</span>
                        </div>
                        <div>
                            <span className="text-6xl font-bold text-white tracking-tighter">{totalClasses}</span>
                            <p className="text-muted text-sm mt-2">total classes tracked</p>
                        </div>
                    </motion.div>
                </div>

                {/* Subjects Section */}
                <div id="subjects-section" className="mb-8 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">
                        My Subjects
                    </h2>
                    <span className="text-xs text-muted font-mono bg-white/5 px-3 py-1.5 rounded-full">{subjects.length} TRACKED</span>
                </div>

                {subjects.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card p-16 text-center border-dashed border-2 border-white/10 bg-transparent"
                    >
                        <div className="w-20 h-20 bg-gradient-to-br from-white/5 to-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8">
                            <BookOpen className="w-10 h-10 text-muted" />
                        </div>
                        <h3 className="text-2xl font-semibold text-white mb-3">No subjects tracked yet</h3>
                        <p className="text-muted text-base mb-8 max-w-md mx-auto">
                            Add your first subject to start tracking attendance and calculating safe bunks.
                        </p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="inline-flex items-center gap-2 bg-white text-black font-semibold px-6 py-3 rounded-full hover:bg-white/90 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Add First Subject
                        </button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence mode='popLayout'>
                            {subjects.map((subject, index) => (
                                <SubjectCard key={subject.id} subject={subject} index={index} />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            <Dock items={dockItems} />

            <AddSubjectModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
            <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
            <AttendanceHistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} />
        </div>
    )
}
