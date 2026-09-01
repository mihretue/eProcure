import { PrismaClient, ProcurementRequest } from '@prisma/client';
import { ProcurementStatus } from '../types';

export class ProcurementWorkflowService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Advances the procurement request to the next logical status, if valid.
   */
  async transitionStatus(procurementRequestId: string, nextStatus: ProcurementStatus): Promise<ProcurementRequest> {
    const request = await this.prisma.procurementRequest.findUnique({
      where: { id: procurementRequestId }
    });

    if (!request) throw new Error('Procurement Request not found');

    const currentStatus = request.status as ProcurementStatus;
    
    if (!this.isValidTransition(currentStatus, nextStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${nextStatus}`);
    }

    // Additional validations can be added here
    // e.g., to enter ANALYSIS, there must be at least one quotation
    if (nextStatus === ProcurementStatus.ANALYSIS) {
        const quotationCount = await this.prisma.quotation.count({ where: { procurementRequestId }});
        if (quotationCount === 0) {
            throw new Error('Cannot transition to Analysis without any quotations.');
        }
    }

    return await this.prisma.procurementRequest.update({
      where: { id: procurementRequestId },
      data: { status: nextStatus }
    });
  }

  private isValidTransition(current: ProcurementStatus, next: ProcurementStatus): boolean {
    const validTransitions: Record<ProcurementStatus, ProcurementStatus[]> = {
      [ProcurementStatus.DRAFT]: [ProcurementStatus.MARKET_RESEARCH, ProcurementStatus.CANCELLED],
      [ProcurementStatus.MARKET_RESEARCH]: [ProcurementStatus.ANALYSIS, ProcurementStatus.CANCELLED, ProcurementStatus.DRAFT],
      [ProcurementStatus.ANALYSIS]: [ProcurementStatus.READY_FOR_PROCUREMENT, ProcurementStatus.MARKET_RESEARCH, ProcurementStatus.CANCELLED],
      [ProcurementStatus.READY_FOR_PROCUREMENT]: [ProcurementStatus.COMPLETED, ProcurementStatus.ANALYSIS, ProcurementStatus.CANCELLED],
      [ProcurementStatus.COMPLETED]: [],
      [ProcurementStatus.CANCELLED]: [],
    };

    return validTransitions[current]?.includes(next) ?? false;
  }
}
