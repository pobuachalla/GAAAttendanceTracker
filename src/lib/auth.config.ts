import type { NextAuthConfig } from 'next-auth'

// Edge-safe auth config — no Prisma, no Node-only modules.
// Used by middleware for JWT verification only.
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isPublic =
        nextUrl.pathname.startsWith('/login') ||
        nextUrl.pathname.startsWith('/api/auth')
      if (isPublic) return true
      if (!isLoggedIn) return Response.redirect(new URL('/login', nextUrl))
      return true
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  providers: [], // providers added in auth.ts
}
