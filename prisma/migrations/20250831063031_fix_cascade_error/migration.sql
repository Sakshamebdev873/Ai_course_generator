-- DropForeignKey
ALTER TABLE "public"."Week" DROP CONSTRAINT "Week_courseId_fkey";

-- AddForeignKey
ALTER TABLE "public"."Week" ADD CONSTRAINT "Week_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
