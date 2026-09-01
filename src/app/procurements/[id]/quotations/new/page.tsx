import NewQuotationForm from '@/components/NewQuotationForm';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function NewQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const procurement = await prisma.procurementRequest.findUnique({
    where: { id },
    include: {
      requirements: true,
    }
  });

  const suppliers = await prisma.supplier.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { name: 'asc' }
  });

  // Dummy user ID for MVP
  const officer = await prisma.user.findFirst({ where: { role: 'PROCUREMENT_OFFICER' }});

  if (!procurement) {
    return <div className="page-container">Procurement Request not found.</div>;
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: '2rem' }}>
        <Link href={`/procurements/${procurement.id}`} style={{ color: 'var(--info)', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
          &larr; Back to Procurement Details
        </Link>
        <h1>Add Supplier Quotation</h1>
        <p style={{ color: 'var(--text-muted)' }}>Enter the quotation details and specifications offered by the supplier for <strong>{procurement.title}</strong>.</p>
      </div>

      <div className="card">
        <NewQuotationForm 
          procurement={procurement} 
          suppliers={suppliers} 
          createdById={officer?.id || ''} 
        />
      </div>
    </div>
  );
}
