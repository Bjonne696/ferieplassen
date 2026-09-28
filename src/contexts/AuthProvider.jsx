import { useCallback, useEffect, useRef, useState } from 'react'
import supabase from '../lib/supabaseClient'
import { AuthContext } from './AuthContext'
import {
  canAcceptSessionResult,
  createAuthSessionCoordinator,
  shouldResolveInitialGuest,
} from '../utils/authSessionCoordinator'

const PROFILE_TIMEOUT_MS = 12000

const withTimeout = (promise, timeoutMs) => {
  let timeoutId
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error('Forespørselen tok for lang tid. Prøv igjen.')), timeoutMs)
  })
  return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timeoutId))
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileStatus, setProfileStatus] = useState('loading')
  const [profileError, setProfileError] = useState(null)
  const coordinatorRef = useRef(null)
  const authEventVersionRef = useRef(0)
  if (!coordinatorRef.current) coordinatorRef.current = createAuthSessionCoordinator()
  const coordinator = coordinatorRef.current

  const applyIdentity = useCallback((currentUser) => {
    const nextUserId = currentUser?.id ?? null
    const transition = coordinator.setIdentity(nextUserId)
    if (transition.changed) {
      setProfile(null)
      setProfileError(null)
      setProfileStatus(currentUser ? 'loading' : 'signedOut')
      setLoading(!!currentUser)
    } else if (shouldResolveInitialGuest(transition, currentUser)) {
      // Supabase may emit INITIAL_SESSION(null) before getSession resolves.
      // Resolve guest auth state so protected routes do not remain suspended.
      setProfileStatus('signedOut')
      setLoading(false)
    }
    setUser(currentUser)
  }, [coordinator])

  const loadProfile = useCallback(async (expectedUserId, request) => {
    try {
      const { data: profileData, error } = await withTimeout(
        supabase
          .from('profiles')
          .select('*')
          .eq('id', expectedUserId)
          .maybeSingle(),
        PROFILE_TIMEOUT_MS,
      )
      if (!coordinator.isCurrent(request, expectedUserId)) return null
      if (error) throw error
      if (!profileData || profileData.id !== expectedUserId) {
        throw new Error('Profilen ble ikke funnet for denne kontoen. Prøv å laste profilen på nytt.')
      }
      setProfile(profileData)
      setProfileError(null)
      setProfileStatus('ready')
      return profileData
    } catch (error) {
      if (coordinator.isCurrent(request, expectedUserId)) {
        setProfile(null)
        setProfileError(error?.message || 'Profilen kunne ikke lastes. Prøv igjen.')
        setProfileStatus('error')
      }
      return null
    } finally {
      if (coordinator.isCurrent(request, expectedUserId)) {
        setLoading(false)
      }
    }
  }, [coordinator])

  useEffect(() => {
    if (!user?.id) return undefined
    const request = coordinator.currentRevision()
    void loadProfile(user.id, request)
    return () => {
      // Invalidate this request when the identity changes or provider unmounts.
      coordinator.invalidate(request)
    }
  }, [user?.id, loadProfile, coordinator])

  const getCurrentSessionUser = useCallback(async (expectedUserId) => {
    const requestRevision = coordinator.currentRevision()
    const authEventVersion = authEventVersionRef.current
    const { data, error } = await withTimeout(supabase.auth.getSession(), PROFILE_TIMEOUT_MS)
    const sessionUser = data?.session?.user
    if (error || !sessionUser || (expectedUserId && sessionUser.id !== expectedUserId)) {
      throw new Error('Ingen aktiv innlogging for denne kontoen. Logg inn og prøv igjen.')
    }

    const identityAfterLookup = coordinator.getIdentity()
    if (!canAcceptSessionResult(
      coordinator,
      requestRevision,
      authEventVersionRef.current !== authEventVersion,
      sessionUser.id,
    )) {
      throw new Error('Innloggingen ble endret mens profilen ble kontrollert. Logg inn igjen og prøv på nytt.')
    }
    if (identityAfterLookup && identityAfterLookup !== sessionUser.id) {
      throw new Error('En annen bruker er logget inn. Logg inn med riktig konto før du laster profilen.')
    }
    if (!identityAfterLookup) {
      applyIdentity(sessionUser)
    }
    return sessionUser
  }, [applyIdentity, coordinator])

  const refreshProfile = useCallback(async (expectedUserId) => {
    await getCurrentSessionUser(expectedUserId)
    const request = coordinator.beginRequest()
    const loadedProfile = await loadProfile(expectedUserId, request)
    if (!loadedProfile) {
      throw new Error('Kontoen er opprettet, men profilen kunne ikke lastes. Prøv «Last profilen på nytt» eller logg inn senere.')
    }
    return loadedProfile
  }, [coordinator, getCurrentSessionUser, loadProfile])

  useEffect(() => {
    let active = true
    const initialEventVersion = authEventVersionRef.current
    const initialSessionRevision = coordinator.currentRevision()
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      authEventVersionRef.current += 1
      // Same-user SIGNED_IN and TOKEN_REFRESHED events must not reset profile state
      // or remount protected forms.
      applyIdentity(session?.user ?? null)
    })
    withTimeout(supabase.auth.getSession(), PROFILE_TIMEOUT_MS).then(({ data, error }) => {
      if (
        active &&
        initialEventVersion === authEventVersionRef.current &&
        initialSessionRevision === coordinator.currentRevision()
      ) {
        applyIdentity(error ? null : data?.session?.user ?? null)
        if (error) {
          setProfileError(error.message || 'Innloggingstilstanden kunne ikke kontrolleres.')
          setProfileStatus('error')
          setLoading(false)
        } else if (!data?.session?.user) {
          setLoading(false)
          setProfileStatus('signedOut')
        }
      }
    }).catch(() => {
      if (
        active &&
        initialEventVersion === authEventVersionRef.current &&
        initialSessionRevision === coordinator.currentRevision()
      ) {
        applyIdentity(null)
        setProfileError('Innloggingstilstanden kunne ikke kontrolleres. Last siden på nytt eller logg inn igjen.')
        setProfileStatus('error')
        setLoading(false)
      }
    })

    return () => {
      active = false
      coordinator.beginRequest()
      if (listener?.subscription?.unsubscribe) {
        listener.subscription.unsubscribe()
      }
    }
  }, [applyIdentity, coordinator])

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      profileStatus,
      profileError,
      getCurrentSessionUser,
      refreshProfile,
      isLoggedIn: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  )
}