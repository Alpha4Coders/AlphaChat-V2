const LoadingSpinner = ({ size = 'md', message = '' }) => {
    const sizeClasses = {
        sm: 'w-5 h-5',
        md: 'w-8 h-8',
        lg: 'w-12 h-12'
    }

    return (
        <div className="flex flex-col items-center justify-center gap-3">
            <div className={`${sizeClasses[size]} border-2 border-primary-500 border-t-transparent rounded-full animate-spin`}></div>
            {message && (
                <p className="text-gray-400 text-sm animate-pulse">{message}</p>
            )}
        </div>
    )
}

export default LoadingSpinner
