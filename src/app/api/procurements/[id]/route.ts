import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const procurement = await prisma.procurementRequest.findUnique({
      where: { id },
      include: {
        requirements: true,
        createdBy: { select: { name: true, email: true } },
        marketAnalysis: true,
        quotations: {
          include: {
            supplier: true,
            specifications: true,
          }
        }
      }
    });

    if (!procurement) {
      return NextResponse.json({ error: 'Procurement Request not found' }, { status: 404 });
    }

    return NextResponse.json(procurement);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
