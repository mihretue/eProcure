import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PriceAnalysisService } from '@/domain/analysis/PriceAnalysisService';
import { SupplierRankingService } from '@/domain/ranking/SupplierRankingService';
import { ProcurementWorkflowService } from '@/domain/procurement/ProcurementWorkflowService';
import { ProcurementStatus } from '@/domain/types';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: procurementRequestId } = await params;
    const { createdById } = await req.json();

    if (!createdById) {
      return NextResponse.json({ error: 'createdById is required' }, { status: 400 });
    }

    const priceAnalysisService = new PriceAnalysisService(prisma);
    const rankingService = new SupplierRankingService(prisma);
    const workflowService = new ProcurementWorkflowService(prisma);

    // 1. Generate Price Analysis
    const analysis = await priceAnalysisService.generateAnalysis(procurementRequestId, createdById);

    // 2. Rank Suppliers
    await rankingService.rankSuppliers(procurementRequestId);

    // 3. Attempt to transition status to ANALYSIS
    try {
        await workflowService.transitionStatus(procurementRequestId, ProcurementStatus.ANALYSIS);
    } catch (e) {
        // Ignore if already in ANALYSIS or later stage
    }

    return NextResponse.json(analysis, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
