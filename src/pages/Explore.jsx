import { useAuth } from '../hooks/useAuth'

export default function Explore() {
  const { user, loading } = useAuth()

  return (
    <div>
      <h1>Explore</h1>
      <p>{loading ? 'Checking session…' : user ? `Logged in as ${user.email}` : 'Not logged in'}</p>
    </div>
  )
}