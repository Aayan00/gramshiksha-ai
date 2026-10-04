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
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [school, setSchool] = useState<School | null>(null)
  const [token, setTokenState] = useState<string | null>(getAuthToken())
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const fetchProfile = useCallback(async () => {
    try {
      const data = await api.getMe()
      setUser({
        id: data.id,
        school_id: data.school_id,
        role: data.role as any,
        display_name: data.display_name,
        email: data.email,
        phone: null,
        is_active: true,
      })
      if (data.school) {
        setSchool(data.school)
      }
    } catch (err) {
      console.warn('Could not fetch user profile:', err)
      setUser(null)
      setSchool(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // 1. If Supabase is active, listen to auth state changes
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.access_token) {
          setAuthToken(session.access_token)
          setTokenState(session.access_token)
          fetchProfile()
        } else {
          // Check if dev token exists in local storage
          const stored = getAuthToken()
          if (stored && stored.startsWith('dev-')) {
            fetchProfile()
          } else {
            setIsLoading(false)
          }
        }
      })

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.access_token) {
          setAuthToken(session.access_token)
          setTokenState(session.access_token)
          fetchProfile()
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    } else {
      // 2. Offline / local dev mode: auto-fetch with active token
      if (token) {
        fetchProfile()
      } else {
        setIsLoading(false)
      }
    }
  }, [fetchProfile, token])

  const loginAsDev = async (role: 'school_admin' | 'teacher' | 'staff') => {
    setIsLoading(true)
    const devToken = `dev-${role}`
    setAuthToken(devToken)
    setTokenState(devToken)
    await fetchProfile()
  }

  const loginWithSupabase = async (email: string, pass: string) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase Auth is not configured. Please use Quick Role Login for local testing.')
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
      await fetchProfile()
    }
  }

  const registerWithSupabase = async (email: string, pass: string, name: string) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase Auth is not configured. Please use Quick Role Login for local testing.')
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
      await fetchProfile()
    } else {
      setIsLoading(false)
    }
  }

  const logout = () => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut()
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
