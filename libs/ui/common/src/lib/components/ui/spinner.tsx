import * as React from 'react'
import { RiLoaderLine } from '@remixicon/react'

import { cn } from '../../utils'

type SpinnerProps = Omit<React.ComponentProps<typeof RiLoaderLine>, 'children'>

function Spinner({ className, ...props }: SpinnerProps) {
  return (
    <RiLoaderLine role="status" aria-label="Loading" className={cn("size-4 animate-spin", className)} {...props} />
  )
}

export { Spinner }
