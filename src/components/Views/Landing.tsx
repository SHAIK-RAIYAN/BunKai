import { useRef, useState } from 'react'
import { usePersistence } from '../../hooks/usePersistence'

interface LandingProps {
  onBookLoaded: () => void
}

export function Landing({ onBookLoaded }: LandingProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const { saveBookToDevice } = usePersistence()

  const handleFileSelect = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.epub')) {
      alert('Please select a valid .epub file')
      return
    }

    try {
      await saveBookToDevice(file)
      onBookLoaded()
    } catch (error) {
      console.error('Failed to save book:', error)
      alert('Failed to load book. Please try again.')
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Critical Fix: Only disable drag if we are actually leaving the main container
    // This prevents flickering when dragging over child elements
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return
    }
    
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }

  return (
    <div
      className="h-full w-full overflow-y-auto relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Inner container ensures centering and minimum height */}
      <div className="min-h-full flex flex-col items-center justify-center p-8">
        <div className="text-center z-10 pointer-events-none">
          <h1
            className="text-6xl font-light mb-4 tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            BunKai
          </h1>
          <p
            className="text-lg mb-8 opacity-70"
            style={{ color: 'var(--text-primary)' }}
          >
            Drop your .epub here
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleBrowseClick()
            }}
            className="text-sm underline opacity-60 hover:opacity-100 transition-opacity pointer-events-auto cursor-pointer"
            style={{ color: 'var(--text-primary)' }}
          >
            Browse
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".epub"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Drag Overlay - Centered Box */}
      {isDragging && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20 pointer-events-none transition-all duration-300">
          <div
            className="w-[80%] h-[60%] max-w-4xl border-4 border-dashed rounded-3xl flex items-center justify-center animate-pulse"
            style={{
              borderColor: 'var(--text-primary)',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
            }}
          >
            <p 
                className="text-xl font-medium tracking-widest uppercase"
                style={{ color: 'var(--text-primary)' }}
            >
                Release to Load
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
