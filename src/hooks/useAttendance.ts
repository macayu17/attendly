import { useMemo } from 'react'

interface AttendanceStats {
    present: number
    absent: number
    cancelled: number
    total: number
    percentage: number
    goalPercentage: number
}

interface AttendanceResult {
    stats: AttendanceStats
    bunkBuffer: number
    recoveryRequired: number
    isAboveGoal: boolean
    isSafe: boolean
}

/**
 * Calculate attendance statistics and metrics
 * @param present - Number of classes attended
 * @param absent - Number of classes missed
 * @param cancelled - Number of cancelled classes (ignored)
 * @param goalPercentage - Target attendance percentage (default 75%)
 */
export function useAttendance(
    present: number,
    absent: number,
    cancelled: number = 0,
    goalPercentage: number = 75
): AttendanceResult {
    return useMemo(() => {
        const total = present + absent
        const goal = goalPercentage / 100

        // Calculate current percentage
        const percentage = total > 0 ? (present / total) * 100 : 0

        // Check if above goal
        const isAboveGoal = percentage >= goalPercentage

        // Bunk Buffer Calculation
        // Formula: How many more classes can you skip while staying at or above goal
        // present / (total + x) >= goal
        // present >= goal * (total + x)
        // present - goal * total >= goal * x
        // x <= (present - goal * total) / goal
        let bunkBuffer = 0
        if (isAboveGoal && total > 0) {
            bunkBuffer = Math.floor((present - goal * total) / goal)
            if (bunkBuffer < 0) bunkBuffer = 0
        }

        // Recovery Path Calculation
        // Formula: How many consecutive classes to attend to reach goal
        // (present + x) / (total + x) >= goal
        // present + x >= goal * (total + x)
        // present + x >= goal * total + goal * x
        // x - goal * x >= goal * total - present
        // x * (1 - goal) >= goal * total - present
        // x >= (goal * total - present) / (1 - goal)
        let recoveryRequired = 0
        if (!isAboveGoal && total > 0) {
            recoveryRequired = Math.ceil((goal * total - present) / (1 - goal))
            if (recoveryRequired < 0) recoveryRequired = 0
        }

        // Safety check - are we comfortably above goal?
        const isSafe = percentage >= goalPercentage + 5

        return {
            stats: {
                present,
                absent,
                cancelled,
                total,
                percentage,
                goalPercentage,
            },
            bunkBuffer,
            recoveryRequired,
            isAboveGoal,
            isSafe,
        }
    }, [present, absent, cancelled, goalPercentage])
}

/**
 * Calculate bunk buffer for a single subject
 */
export function calculateBunkBuffer(
    present: number,
    total: number,
    goalPercentage: number = 75
): number {
    if (total === 0) return 0
    const goal = goalPercentage / 100
    const buffer = Math.floor((present - goal * total) / goal)
    return buffer > 0 ? buffer : 0
}

/**
 * Calculate recovery classes needed for a single subject
 */
export function calculateRecovery(
    present: number,
    total: number,
    goalPercentage: number = 75
): number {
    if (total === 0) return 0
    const goal = goalPercentage / 100
    const currentPercentage = (present / total) * 100

    if (currentPercentage >= goalPercentage) return 0

    const recovery = Math.ceil((goal * total - present) / (1 - goal))
    return recovery > 0 ? recovery : 0
}

/**
 * Get status badge based on percentage
 */
export function getAttendanceStatus(
    percentage: number,
    goalPercentage: number = 75
): 'safe' | 'warning' | 'danger' {
    if (percentage >= goalPercentage + 5) return 'safe'
    if (percentage >= goalPercentage - 5) return 'warning'
    return 'danger'
}
