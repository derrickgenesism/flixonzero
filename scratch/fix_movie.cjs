const fs = require('fs');
let code = fs.readFileSync('src/app/movie/[id]/page.js', 'utf8');

// Add the import at the top (after existing imports)
code = code.replace(
  "import PayPerViewButton from '@/components/PayPerViewButton';",
  "import PayPerViewButton from '@/components/PayPerViewButton';\nimport AlreadyPaidButton from '@/components/AlreadyPaidButton';"
);

// Place 1: Inside the big centered paywall block — after the Subscribe to Watch link and before the !user check
code = code.replace(
  `                        <Link href="/checkout" className="gms-btn gms-btn--primary" style={{ fontSize: '16px', padding: '14px 32px' }}>
                          Subscribe to Watch
                        </Link>
                      </div>
                      {!user && (`,
  `                        <Link href="/checkout" className="gms-btn gms-btn--primary" style={{ fontSize: '16px', padding: '14px 32px' }}>
                          Subscribe to Watch
                        </Link>
                      </div>
                      {user && <AlreadyPaidButton />}
                      {!user && (`
);

// Place 2: In the side action buttons block — after the smaller Subscribe to Watch link
code = code.replace(
  `              {!hasAccess && (
                <Link href="/checkout" className="gms-btn gms-btn--primary">Subscribe to Watch</Link>
              )}`,
  `              {!hasAccess && (
                <>
                  <Link href="/checkout" className="gms-btn gms-btn--primary">Subscribe to Watch</Link>
                  {user && <AlreadyPaidButton />}
                </>
              )}`
);

fs.writeFileSync('src/app/movie/[id]/page.js', code);
console.log('Done');
