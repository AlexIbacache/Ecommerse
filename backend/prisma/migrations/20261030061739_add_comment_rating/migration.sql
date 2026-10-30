-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "rating" INTEGER;

-- Defensa en profundidad: la API ya valida 1-5 con Zod.
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_rating_range" CHECK ("rating" IS NULL OR "rating" BETWEEN 1 AND 5);
