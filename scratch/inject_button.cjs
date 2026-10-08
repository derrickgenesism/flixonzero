const fs = require('fs');
let code = fs.readFileSync('src/app/movie/[id]/page.js', 'utf8');

// Inject at Location 1 (Main player area paywall)
code = code.replace(
  /(\s*<Link href="\/checkout" className="gms-btn gms-btn--primary" style=\{\{ fontSize: '16px', padding: '14px 32px' \}\}>\s*Subscribe to Watch\s*<\/Link>\s*<\/div>)\s*\{\!user && \(/,
  '$1\n                      {user && <AlreadyPaidButton />}\n                      {!user && ('
);

// Inject at Location 2 (Sidebar/Action buttons area)
code = code.replace(
  /(\{\!hasAccess && \(\s*<Link href="\/checkout" className="gms-btn gms-btn--primary">Subscribe to Watch<\/Link>\s*\)\})/,
  `{!hasAccess && (
                  <>
                    <Link href="/checkout" className="gms-btn gms-btn--primary">Subscribe to Watch</Link>
                    {user && <AlreadyPaidButton />}
                  </>
                )}`
);

fs.writeFileSync('src/app/movie/[id]/page.js', code);
console.log('Injection complete');
