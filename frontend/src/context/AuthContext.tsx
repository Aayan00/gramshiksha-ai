import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { School, UserProfile } from '../types'
import { api, setAuthToken, getAuthToken } from '../services/api'
import { supabase, isSupabaseConfigured } from '../services/supabase'

interface AuthContextType {
  user: UserProfile | null
  school: School | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  isSupabaseEnabled: boolean
  loginAsDev: (role: 'school_admin' | 'teacher' | 'staff') => Promise<void>
  loginWithSupabase: (email: string, pass: string) => Promise<void>
  registerWithSupabase: (email: string, pass: string, name: string) => Promise<void>
  logout: () => void
  refreshProfile: (explicitToken?: string) => Promise<UserProfile | null | void>
}


const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [school, setSchool] = useState<School | null>(null)
  const [token, setTokenState] = useState<string | null>(getAuthToken())
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const fetchProfile = useCallback(async (explicitToken?: string): Promise<UserProfile | null> => {
    const activeToken = explicitToken || getAuthToken()
    if (!activeToken) {
      setUser(null)
      setSchool(null)
      setIsLoading(false)
      return null
    }

    try {
      const data = await api.getMe()
      const profile: UserProfile = {
        id: data.id,
        school_id: data.school_id,
        role: data.role as any,
        display_name: data.display_name,
        email: data.email,
        phone: null,
        is_active: true,
      }
      setUser(profile)
      if (data.school) {
        setSchool(data.school)
      }
      return profile
    } catch (err) {
      console.warn('Could not fetch user profile:', err)
      setUser(null)
      setSchool(null)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const initAuth = async () => {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (!isMounted) return
          if (session?.access_token) {
            setAuthToken(session.access_token)
            setTokenState(session.access_token)
            await fetchProfile(session.access_token).catch(() => {})
          } else {
            const stored = getAuthToken()
            if (stored && stored.startsWith('dev-')) {
              await fetchProfile(stored).catch(() => {
                // If offline, set demo user so experience is not blocked
                const role = (stored.replace('dev-', '') || 'school_admin') as any
                setUser({
                  id: role === 'school_admin' ? '00000000-0000-0000-0000-000000000001' : role === 'teacher' ? '00000000-0000-0000-0000-000000000002' : '00000000-0000-0000-0000-000000000003',
                  school_id: '00000000-0000-0000-0000-000000000100',
                  role,
                  display_name: role === 'school_admin' ? 'Shri. Rameshwar Patil (Headmaster)' : role === 'teacher' ? 'Smt. Sunita Kadam (Teacher)' : 'Shri. Vitthalrao Pawar (Block Staff)',
                  email: `${role}@gramshiksha.local`,
                  phone: null,
                  is_active: true,
                })
              })
            } else {
              setIsLoading(false)
            }
          }
        } catch {
          if (isMounted) setIsLoading(false)
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (!isMounted) return
          if (session?.access_token) {
            setAuthToken(session.access_token)
            setTokenState(session.access_token)
            await fetchProfile(session.access_token).catch(() => {})
          }
        })

        return () => {
          subscription.unsubscribe()
        }
      } else {
        const stored = getAuthToken()
        if (stored) {
          fetchProfile(stored).catch(() => {
            if (stored.startsWith('dev-')) {
              const role = (stored.replace('dev-', '') || 'school_admin') as any
              setUser({
                id: role === 'school_admin' ? '00000000-0000-0000-0000-000000000001' : role === 'teacher' ? '00000000-0000-0000-0000-000000000002' : '00000000-0000-0000-0000-000000000003',
                school_id: '00000000-0000-0000-0000-000000000100',
                role,
                display_name: role === 'school_admin' ? 'Shri. Rameshwar Patil (Headmaster)' : role === 'teacher' ? 'Smt. Sunita Kadam (Teacher)' : 'Shri. Vitthalrao Pawar (Block Staff)',
                email: `${role}@gramshiksha.local`,
                phone: null,
                is_active: true,
              })
            }
          })
        } else {
          setIsLoading(false)
        }
      }
    }

    initAuth()

    return () => {
      isMounted = false
    }
  }, [fetchProfile])

  const loginAsDev = async (role: 'school_admin' | 'teacher' | 'staff') => {
    setIsLoading(true)
    const devToken = `dev-${role}`
    setAuthToken(devToken)
    setTokenState(devToken)

    try {
      await fetchProfile(devToken)
    } catch (err: any) {
      console.warn('Backend /me call failed during dev login, using local fallback profile:', err)
      const fallbackUser: UserProfile = {
        id: role === 'school_admin'
          ? '00000000-0000-0000-0000-000000000001'
          : role === 'teacher'
          ? '00000000-0000-0000-0000-000000000002'
          : '00000000-0000-0000-0000-000000000003',
        school_id: '00000000-0000-0000-0000-000000000100',
        role,
        display_name: role === 'school_admin'
          ? 'Shri. Rameshwar Patil (Headmaster)'
          : role === 'teacher'
          ? 'Smt. Sunita Kadam (Teacher)'
          : 'Shri. Vitthalrao Pawar (Block Staff)',
        email: `${role}@gramshiksha.local`,
        phone: null,
        is_active: true,
      }
      const fallbackSchool: School = {
        id: '00000000-0000-0000-0000-000000000100',
        name: 'Zilla Parishad Primary School, Shirur',
        udise_code: '27251401201',
        panchayat_name: 'Shirur Gram Panchayat',
        district: 'Pune',
        state: 'Maharashtra',
        contact_email: 'zp.shirur@gramshiksha.org',
        contact_phone: '+91 2138 222100',
        academic_year: '2024-2025',
      }
      setUser(fallbackUser)
      setSchool(fallbackSchool)
      setIsLoading(false)
    }
  }

  const loginWithSupabase = async (email: string, pass: string) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase Auth is not configured. Please use Quick Dev Login or set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.')
    }
    setIsLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (error) {
      setIsLoading(false)
      throw error
    }
    if (data.session?.access_token) {
      setAuthToken(data.session.access_token)
      setTokenState(data.session.access_token)
      await fetchProfile(data.session.access_token)
    }
  }

  const registerWithSupabase = async (email: string, pass: string, name: string) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase Auth is not configured. Please use Quick Dev Login or set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.')
    }
    setIsLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          display_name: name,
        },
      },
    })
    if (error) {
      setIsLoading(false)
      throw error
    }
    if (data.session?.access_token) {
      setAuthToken(data.session.access_token)
      setTokenState(data.session.access_token)
      await fetchProfile(data.session.access_token)
    } else {
      setIsLoading(false)
    }
  }

  const logout = () => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut().catch(() => {})
    }
    setAuthToken(null)
    setTokenState(null)
    setUser(null)
    setSchool(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        school,
        token,
        isLoading,
        isAuthenticated: Boolean(user),
        isSupabaseEnabled: isSupabaseConfigured,
        loginAsDev,
        loginWithSupabase,
        registerWithSupabase,
        logout,
        refreshProfile: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

