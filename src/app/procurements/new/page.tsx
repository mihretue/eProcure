import NewProcurementForm from '@/components/NewProcurementForm';
import { prisma } from '@/lib/prisma';

export default async function NewProcurementPage() {
  // Pass the ID of the procurement officer (for MVP, we assume a static user)
  const officer = await prisma.user.findFirst({ where: { role: 'PROCUREMENT_OFFICER' }});
  
  return (
    <div className="page-container">
      <div style={{ marginBottom: '2rem' }}>
        <h1>Create Procurement Request</h1>
        <p style={{ color: 'var(--text-muted)' }}>Define the procurement requirements and select an item from the catalog.</p>
      </div>

      <div className="card">
        <NewProcurementForm createdById={officer?.id || ''} />
      </div>
    </div>
  );
}
