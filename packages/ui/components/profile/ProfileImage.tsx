import { Edit, PersonOutline } from '@mui/icons-material'
import clsx from 'clsx'
import { forwardRef, useEffect, useState } from 'react'

export interface ProfileImageProps {
  imageUrl?: string
  loading?: boolean
  size: 'xs' | 'sm' | 'lg'
  className?: string
  fallbackIconClassName?: string
  onClick?: () => void
  onEdit?: () => void
}

export const ProfileImage = forwardRef<HTMLDivElement, ProfileImageProps>(
  function ProfileImage(
    {
      imageUrl,
      loading,
      size,
      className,
      fallbackIconClassName,
      onClick,
      onEdit,
    },
    ref
  ) {
    const [loadedImage, setLoadedImage] = useState<string>()
    useEffect(() => {
      if (!imageUrl) {
        setLoadedImage(undefined)
        return
      }

      const onLoad = () => setLoadedImage(imageUrl)

      const image = new Image()
      image.addEventListener('load', onLoad)
      image.src = imageUrl

      // Clean up.
      return () => image.removeEventListener('load', onLoad)
    }, [imageUrl])

    const loadingImage = loading || loadedImage !== imageUrl

    // Size and rounding of container and children.
    const sizingRoundingClassNames = clsx({
      'w-8 h-8 rounded-full': size === 'xs',
      'w-10 h-10 rounded-xl': size === 'sm',
      'w-16 h-16 rounded-2xl': size === 'lg',
    })

    return (
      <div
        className={clsx(
          // Center icon.
          'flex relative justify-center items-center',
          (!imageUrl || loadingImage) &&
            'border border-border-interactive-disabled',
          sizingRoundingClassNames,
          // Pulse person placeholder when loading.
          loadingImage &&
            'border border-border-interactive-disabled animate-pulse',
          // Make clickable for onClick and onEdit.
          (onClick || onEdit) && 'cursor-pointer',
          // Enable group events for onEdit.
          onEdit && 'group',

          className
        )}
        onClick={onClick}
        ref={ref}
      >
        {/* Image */}
        <div
          className={clsx(
            'absolute top-0 right-0 bottom-0 left-0 bg-center bg-cover',
            onEdit && 'brightness-100 group-hover:brightness-[0.35] transition',
            sizingRoundingClassNames
          )}
          style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : {}}
        ></div>

        {/* No image (hides underneath image always) */}
        <PersonOutline
          className={clsx(
            '!w-1/2 !h-1/2 text-icon-interactive-disabled',
            fallbackIconClassName
          )}
        />

        {/* Edit icon */}
        {onEdit && (
          <div
            className={clsx(
              'flex absolute top-0 right-0 bottom-0 left-0 justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity',
              sizingRoundingClassNames
            )}
            onClick={onEdit}
          >
            <Edit className="!w-1/2 !h-1/2 text-icon-primary" />
          </div>
        )}
      </div>
    )
  }
)
