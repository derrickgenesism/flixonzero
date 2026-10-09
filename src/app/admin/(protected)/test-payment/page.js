import TestPaymentClient from './TestPaymentClient';

export const metadata = {
  title: 'Test Payment Integration | Admin',
};

export default function TestPaymentPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <TestPaymentClient />
    </div>
  );
}
