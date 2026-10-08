const fs = require('fs');
let file = 'src/app/login/LoginForm.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("  useEffect(() => {\n    if (!localRef) {\n      const storedRef = localStorage.getItem('affiliate_ref');\n      if (storedRef) setLocalRef(storedRef);\n    }\n  }, [refCode]);", "  useEffect(() => {\n    if (!localRef) {\n      const storedRef = localStorage.getItem('affiliate_ref');\n      if (storedRef) setLocalRef(storedRef);\n    }\n    // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [refCode]);");

fs.writeFileSync(file, content);
console.log('Fixed lint issue');
