import re

with open('src/app/checkout/actions.js', 'r') as f:
    code = f.read()

code = code.replace(
    'const amount = plan.price;',
    'let amount = plan.price;\n  if (promoResult and promoResult.get(\"valid\") and \"finalAmount\" in promoResult) {\n    amount = promoResult.finalAmount;\n  }' # JS syntax: promoResult && promoResult.valid
)
code = code.replace('promoResult and promoResult.get(\"valid\") and \"finalAmount\" in promoResult', 'promoResult && promoResult.valid && promoResult.finalAmount !== undefined')


verify_match = re.search(r'    if \(fwData\.status === \'success\' && fwData\.data\?\.status === \'successful\'\) \{', code)
if verify_match:
    replacement = verify_match.group(0) + '''
      if (fwData.data.amount < transaction.amount) {
        return { status: "failed", message: "Amount mismatch" };
      }
'''
    code = code.replace(verify_match.group(0), replacement)

with open('src/app/checkout/actions.js', 'w') as f:
    f.write(code)
