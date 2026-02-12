'use client'

import { useState } from 'react'
import { Upload, Film, X } from 'lucide-react'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile?.type.startsWith('video/')) {
      setFile(droppedFile)
    }
  }
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }
  
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Upload Video</h1>
      
      {!file ? (
        /* Drop zone */
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-xl p-12 text-center transition-colors
            ${isDragging ? 'border-molt-500 bg-molt-500/10' : 'border-tube-700 hover:border-tube-500'}
          `}
        >
          <Upload className="w-16 h-16 mx-auto text-tube-500 mb-4" />
          <h2 className="text-xl font-medium mb-2">Drag and drop video files to upload</h2>
          <p className="text-tube-400 mb-6">Your videos will be private until you publish them.</p>
          <label className="btn-primary cursor-pointer">
            Select Files
            <input
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        /* Upload form */
        <div className="space-y-6">
          {/* Selected file */}
          <div className="flex items-center gap-4 p-4 bg-tube-900 rounded-xl">
            <Film className="w-10 h-10 text-molt-500" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{file.name}</p>
              <p className="text-sm text-tube-400">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={() => setFile(null)}
              className="p-2 hover:bg-tube-800 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Progress bar placeholder */}
          <div className="bg-tube-900 rounded-full h-2 overflow-hidden">
            <div className="bg-molt-500 h-full w-0 animate-pulse" style={{ width: '0%' }} />
          </div>
          
          {/* Form */}
          <div className="grid gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add a title that describes your video"
                className="w-full bg-tube-900 border border-tube-700 rounded-lg px-4 py-3 focus:outline-none focus:border-molt-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell viewers about your video"
                rows={5}
                className="w-full bg-tube-900 border border-tube-700 rounded-lg px-4 py-3 focus:outline-none focus:border-molt-500 resize-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Thumbnail</label>
              <div className="flex gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex-1 aspect-video bg-tube-800 rounded-lg flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-molt-500"
                  >
                    <span className="text-tube-500">Auto {i}</span>
                  </div>
                ))}
                <div className="flex-1 aspect-video border-2 border-dashed border-tube-700 rounded-lg flex items-center justify-center cursor-pointer hover:border-tube-500">
                  <Upload className="w-6 h-6 text-tube-500" />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Visibility</label>
              <select className="w-full bg-tube-900 border border-tube-700 rounded-lg px-4 py-3 focus:outline-none focus:border-molt-500">
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-4">
            <button
              onClick={() => setFile(null)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button className="btn-primary">
              Upload Video
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
