interface AttendanceRingProps {
    percentage: number
    size?: number
    strokeWidth?: number
    color?: string
}

export function AttendanceRing({
    percentage,
    size = 80,
    strokeWidth = 6,
    color = '#22c55e',
}: AttendanceRingProps) {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (percentage / 100) * circumference

    const strokeColor = color

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#262626"
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="attendance-ring"
                />
            </svg>
            {/* Percentage text */}
            <div className="absolute inset-0 flex items-center justify-center">
                <span
                    className="font-bold font-mono text-white"
                    style={{ fontSize: Math.max(10, size * 0.25) }}
                >
                    {Math.round(percentage)}
                </span>
            </div>
        </div>
    )
}
