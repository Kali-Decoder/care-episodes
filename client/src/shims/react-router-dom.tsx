'use client'

import Link from 'next/link'
import {
  useParams as useNextParams,
  usePathname,
  useRouter,
  useSearchParams as useNextSearchParams,
} from 'next/navigation'
import {
  type CSSProperties,
  type ReactNode,
} from 'react'

type NavigateTo = string | number

export function useNavigate() {
  const router = useRouter()
  return (to: NavigateTo) => {
    if (typeof to === 'number') {
      if (to < 0) router.back()
      else router.forward()
      return
    }
    router.push(to)
  }
}

export function useParams<T extends Record<string, string | string[] | undefined>>() {
  return useNextParams() as T
}

export function useSearchParams() {
  const searchParams = useNextSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const setSearchParams = (next: Record<string, string> | URLSearchParams) => {
    const params =
      next instanceof URLSearchParams ? next : new URLSearchParams(next)
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  return [searchParams, setSearchParams] as const
}

export function NavLink({
  to,
  end,
  style,
  children,
}: {
  to: string
  end?: boolean
  style?: CSSProperties | ((state: { isActive: boolean }) => CSSProperties)
  children: ReactNode | ((state: { isActive: boolean }) => ReactNode)
}) {
  const pathname = usePathname()
  const isActive = end || to === '/' ? pathname === to : pathname === to || pathname.startsWith(`${to}/`)
  const resolvedStyle = typeof style === 'function' ? style({ isActive }) : style
  const content = typeof children === 'function' ? children({ isActive }) : children

  return (
    <Link href={to} style={resolvedStyle}>
      {content}
    </Link>
  )
}

export function Outlet({ children }: { children?: ReactNode }) {
  return <>{children}</>
}

export function Navigate({ to }: { to: string; replace?: boolean }) {
  const router = useRouter()
  router.replace(to)
  return null
}

export function HashRouter({ children }: { children?: ReactNode }) {
  return <>{children}</>
}

export function Routes({ children }: { children?: ReactNode }) {
  return <>{children}</>
}

export function Route(_props: { path?: string; element?: ReactNode }) {
  return null
}
