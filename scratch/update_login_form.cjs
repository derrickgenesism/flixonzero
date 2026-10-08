const fs = require('fs');
let file = 'src/app/login/LoginForm.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "export default function LoginForm({ refCode }) {",
  "export default function LoginForm({ refCode, googleAuthEnabled = false }) {"
);

const googleBlock = `{/* Google */}
      <form action={signInWithGoogle}>
        <button
          type="submit"
          style={{
            width: '100%',
            background: '#fff',
            color: '#000',
            padding: '12px',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'var(--tr)'
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '18px' }} />
          Continue with Google
        </button>
      </form>`;

const replacementBlock = `{googleAuthEnabled && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', margin: '24px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ color: 'var(--text3)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          <form action={signInWithGoogle}>
            <button
              type="submit"
              style={{
                width: '100%',
                background: '#fff',
                color: '#000',
                padding: '12px',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'var(--tr)'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '18px' }} />
              Continue with Google
            </button>
          </form>
        </>
      )}`;

// We need to also remove the original 'OR' divider if we wrap it.
// Let's replace the whole block from `{/* Separator */}` to the end of the Google form.
const regex = /\{\/\* Separator \*\/\}.*?Continue with Google.*?<\/button>\s*<\/form>/s;
content = content.replace(regex, replacementBlock);

fs.writeFileSync(file, content);
console.log('Updated LoginForm to conditionally render Google auth');
