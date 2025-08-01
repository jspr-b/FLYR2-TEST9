interface LoadingStateProps {
  title?: string
  description?: string
  height?: string
}

export function LoadingState({ 
  title = "Loading...", 
  description,
  height = "h-40" 
}: LoadingStateProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      {title && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
      )}
      <div className={`flex items-center justify-center ${height}`}>
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-500">Loading data...</span>
        </div>
      </div>
    </div>
  )
}

export function EmptyState({ 
  title = "No data available",
  description,
  icon: Icon,
  height = "h-40"
}: {
  title?: string
  description?: string
  icon?: React.ComponentType<any>
  height?: string
}) {
  return (
    <div className={`flex flex-col items-center justify-center ${height} text-center`}>
      {Icon && <Icon className="h-12 w-12 text-gray-400 mb-4" />}
      <p className="text-gray-500 font-medium">{title}</p>
      {description && (
        <p className="text-gray-400 text-sm mt-1">{description}</p>
      )}
    </div>
  )
} 