import type { ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

function AllTheProviders({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { withRouter?: boolean },
) => {
  const { withRouter = true, ...renderOptions } = options || {}
  
  if (withRouter) {
    return render(ui, { wrapper: AllTheProviders, ...renderOptions })
  } else {
    return render(ui, renderOptions)
  }
}

export * from '@testing-library/react'
export { customRender as render }

