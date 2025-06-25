import React, { useContext, useRef } from 'react'
import { AppContext } from '../context/AppContext'

const Result = () => {
  const { resultImage, image, setImage, setResultImage } = useContext(AppContext)
  const fileInputRef = useRef(null)

  const handleTryAnother = () => {
    // Reset the images
    setImage(null)
    setResultImage(null)
    // Trigger hidden file input
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      setResultImage(null) // Reset result image for new processing
    }
  }

  return (
    <div className='mx-4 my-3 lg:mx-44 mt-14 min-h-[75vh]'>

      <div className='bg-white rounded-lg px-8 py-6 drop-shadow-sm'>

        {/* ................image container............ */}
        <div className='flex flex-col sm:grid grid-cols-2 gap-8'>

          {/* ..............left side.................. */}
          <div>
            <p className='font-semibold text-gray-600 mb-2'>Original</p>
            {image ? (
              <img
                className='rounded-md border h-[300px] w-full object-contain bg-white'
                src={URL.createObjectURL(image)}
                alt="original"
              />
            ) : (
              <div className='h-[300px] w-full border rounded-md flex items-center justify-center text-gray-400 text-sm'>
                No image selected
              </div>
            )}
          </div>

          {/* ..........right side ................. */}
          <div className='flex flex-col'>
            <p className='font-semibold text-gray-600 mb-2'>Background removed</p>
            <div className='rounded-md border border-gray-300 h-[300px] relative bg-layer overflow-hidden'>

              {resultImage ? (
                <img
                  className='h-full w-full object-contain bg-white'
                  src={resultImage}
                  alt="bg removed"
                />
              ) : image ? (
                <div className='absolute right-1/2 bottom-1/2 transform translate-x-1/2 translate-y-1/2'>
                  <div className='border-4 border-violet-600 rounded-full h-12 w-12 border-t-transparent animate-spin'></div>
                </div>
              ) : (
                <div className='h-full w-full flex items-center justify-center text-gray-400 text-sm'>
                  No result yet
                </div>
              )}

            </div>
          </div>

        </div>

        {/* buttons  */}
        {resultImage && (
          <div className='flex justify-center sm:justify-end items-center flex-wrap gap-4 mt-6'>
            <button
              onClick={handleTryAnother}
              className='px-8 py-2.5 text-violet-600 text-sm border border-violet-600 rounded-full hover:scale-105 transition-all duration-700'>
              Try another image
            </button>

            <a
              href={resultImage}
              download="bg_removed.png"
              className='px-8 py-2.5 text-white text-sm bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-full hover:scale-105 transition-all duration-700'>
              Download image
            </a>
          </div>
        )}

        {/* hidden input for uploading new image */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

      </div>
    </div>
  )
}

export default Result
