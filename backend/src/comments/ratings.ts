import type { PrismaService } from '../database/prisma.service';

export interface RatingSummary {
  /** Promedio con un decimal, o null si todavía no hay puntuaciones. */
  average: number | null;
  count: number;
}

export interface RatingBreakdown extends RatingSummary {
  /** Cantidad de puntuaciones por estrella, índice 0 = 1 estrella. */
  distribution: [number, number, number, number, number];
}

const VISIBLE_RATED = { status: 'VISIBLE' as const, rating: { not: null } };

/** Solo cuentan los comentarios visibles: ocultar uno lo saca del promedio. */
export async function ratingSummaries(
  prisma: PrismaService,
  productIds: number[],
): Promise<Map<number, RatingSummary>> {
  const result = new Map<number, RatingSummary>();

  if (productIds.length === 0) {
    return result;
  }

  const groups = await prisma.comment.groupBy({
    by: ['productId'],
    where: { productId: { in: productIds }, ...VISIBLE_RATED },
    _avg: { rating: true },
    _count: { rating: true },
  });

  for (const group of groups) {
    result.set(group.productId, {
      average:
        group._avg.rating === null
          ? null
          : Math.round(group._avg.rating * 10) / 10,
      count: group._count.rating,
    });
  }

  return result;
}

export function emptySummary(): RatingSummary {
  return { average: null, count: 0 };
}

export async function ratingBreakdown(
  prisma: PrismaService,
  productId: number,
): Promise<RatingBreakdown> {
  const groups = await prisma.comment.groupBy({
    by: ['rating'],
    where: { productId, ...VISIBLE_RATED },
    _count: { rating: true },
  });

  const distribution: RatingBreakdown['distribution'] = [0, 0, 0, 0, 0];
  let total = 0;
  let sum = 0;

  for (const group of groups) {
    if (group.rating === null || group.rating < 1 || group.rating > 5) {
      continue;
    }
    distribution[group.rating - 1] = group._count.rating;
    total += group._count.rating;
    sum += group.rating * group._count.rating;
  }

  return {
    average: total === 0 ? null : Math.round((sum / total) * 10) / 10,
    count: total,
    distribution,
  };
}
