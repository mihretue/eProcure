import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ProcurementStatus } from '@/domain/types';

export async function GET() {
  try {
    const procurements = await prisma.procurementRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { name: true }
        },
        _count: {
          select: { quotations: true }
        }
      }
    });
    return NextResponse.json(procurements);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { 
      reference, title, description, requiredQuantity, 
      unitOfMeasure, department, requiredDate, 
      createdById, itemId, requirements 
    } = data;

    // We do this in a transaction to ensure requirements snapshot is created
    const procurement = await prisma.$transaction(async (tx) => {
      const pr = await tx.procurementRequest.create({
        data: {
          reference,
          title,
          description,
          requiredQuantity,
          unitOfMeasure,
          department,
          requiredDate: new Date(requiredDate),
          status: ProcurementStatus.DRAFT,
          createdById,
        }
      });

      // Snapshot the requirements
      if (requirements && Array.isArray(requirements)) {
        await tx.procurementRequirement.createMany({
          data: requirements.map((req: any) => ({
            procurementRequestId: pr.id,
            specificationDefinitionId: req.specificationDefinitionId,
            name: req.name,
            type: req.type,
            unit: req.unit,
            required: req.required,
            comparisonType: req.comparisonType,
            requiredValue: req.requiredValue,
            allowedValues: req.allowedValues,
          }))
        });
      }

      return pr;
    });

    return NextResponse.json(procurement, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
