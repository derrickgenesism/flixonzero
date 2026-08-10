import AdminLoginForm from './AdminLoginForm'

export default function AdminLoginPage() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f0f, #1a1a1a)'
    }}>
      <AdminLoginForm />
    </div>
  )
}
