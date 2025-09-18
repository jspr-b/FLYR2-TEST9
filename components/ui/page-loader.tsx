interface PageLoaderProps {
  message?: string
  submessage?: string
}

export function PageLoader({ 
  message = "Loading data...", 
  submessage = "This may take a few seconds" 
}: PageLoaderProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] py-8">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-sm text-gray-500">{message}</p>
        {submessage && (
          <p className="text-xs text-gray-400">{submessage}</p>
        )}
      </div>
    </div>
  )
}

export function PageLoaderWithSidebar({ 
  message = "Loading data...", 
  submessage = "This may take a few seconds" 
}: PageLoaderProps) {
  return (
    <div className="flex">
      <div className="xl:ml-64 flex-1 bg-gray-50 min-h-screen">
        <div className="p-3 xs:p-4 sm:p-6 lg:p-8 pt-14 xs:pt-16 xl:pt-8">
          <PageLoader message={message} submessage={submessage} />
        </div>
      </div>
    </div>
  )
}