interface TimeHeaderProps {
  timeSlots: Date[]
}

export function TimeHeader({ timeSlots }: TimeHeaderProps) {
  return (
    <div className="relative h-10">
      <div className="flex justify-between text-xs text-gray-600 px-2">
        {timeSlots.map((slot, index) => (
          <div key={index} className="flex flex-col items-center min-w-0">
            <span className="font-semibold text-sm">
              {slot.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZone: 'Europe/Amsterdam'
              })}
            </span>
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {index === 0 || slot.getDate() !== timeSlots[index - 1]?.getDate() ? (
                slot.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })
              ) : ''}
            </span>
          </div>
        ))}
      </div>

      {/* Grid lines */}
      <div className="absolute inset-0 flex">
        {timeSlots.map((_, index) => (
          <div key={index} className="flex-1 border-l border-gray-300" />
        ))}
      </div>
    </div>
  )
}