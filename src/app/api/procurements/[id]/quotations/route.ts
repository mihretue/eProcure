import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { QualificationService } from '@/domain/qualification/QualificationService';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: procurementRequestId } = await params;
    const data = await req.json();
    
    const { 
      supplierId, quotationReference, quotationDate, quantity, 
      unitPrice, vatRate, currency, notes, createdById,
      specifications // Array of { procurementRequirementId, value }
    } = data;

    const vatAmount = unitPrice * quantity * (vatRate / 100);
    const subtotal = unitPrice * quantity;
    const totalPrice = subtotal + vatAmount;

    // Create Quotation and its Specifications in a transaction
    const quotation = await prisma.$transaction(async (tx) => {
      const q = await tx.quotation.create({
        data: {
          procurementRequestId,
          supplierId,
          quotationReference,
          quotationDate: new Date(quotationDate),
          quantity,
          unitPrice,
          vatRate,
          vatAmount,
          subtotal,
          totalPrice,
          currency: currency || 'ETB',
          notes,
          createdById,
        }
      });

      if (specifications && Array.isArray(specifications)) {
        await tx.quotationSpecification.createMany({
          data: specifications.map((spec: any) => ({
            quotationId: q.id,
            procurementRequirementId: spec.procurementRequirementId,
            value: spec.value
          }))
        });
      }

      return q;
    });

    // Run qualification engine automatically
    const qualificationService = new QualificationService(prisma);
    await qualificationService.evaluateQuotation(quotation.id);

    // Fetch the updated quotation with status
    const updatedQuotation = await prisma.quotation.findUnique({
      where: { id: quotation.id },
      include: { specifications: true }
    });

    return NextResponse.json(updatedQuotation, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
