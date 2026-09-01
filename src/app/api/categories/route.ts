import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const categories = await prisma.itemCategory.findMany({
      include: {
        items: {
          where: { active: true },
          include: {
            specifications: {
              where: { active: true }
            }
          }
        }
      }
    });
    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
