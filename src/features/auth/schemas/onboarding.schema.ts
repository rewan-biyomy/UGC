import { z } from "zod";
import { CreatorCategory } from "@/components/core/constants/roles";

export const registrationSchema = z.object({
  role: z.enum(["CREATOR", "CLIENT"]),
  name: z.string().trim().min(2, "أدخل الاسم الكامل.").max(100, "الاسم طويل جدًا."),
  age: z.coerce.number().int("أدخل العمر بالأرقام الصحيحة.").min(13, "يجب أن يكون العمر ١٣ عامًا على الأقل.").max(120, "أدخل عمرًا صالحًا."),
  country: z.string().trim().min(2, "اختر الدولة أو أدخل اسمها."),
  email: z.string().trim().email("أدخل بريدًا إلكترونيًا صالحًا."),
  password: z.string().min(8, "كلمة المرور يجب ألا تقل عن ٨ أحرف."),
  confirmPassword: z.string(),
}).refine((values) => values.password === values.confirmPassword, {
  message: "كلمتا المرور غير متطابقتين.",
  path: ["confirmPassword"],
});

export type RegistrationValues = z.infer<typeof registrationSchema>;

export const onboardingSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("CREATOR"),
    age: z.number().int().min(13).max(120),
    country: z.string().trim().min(2, "اختر الدولة أو أدخل اسمها."),
    avatarUrl: z.string().nullable(),
    category: z.enum([
      CreatorCategory.PHOTOGRAPHY_MODEL,
      CreatorCategory.VIDEOGRAPHER,
      CreatorCategory.VIDEO_EDITOR,
    ]),
    nicheIds: z.array(z.string()).min(1, "اختر مجالاً واحداً على الأقل."),
    bio: z.string().trim().min(20, "اكتب نبذة لا تقل عن ٢٠ حرفاً.").max(500, "يجب ألا تتجاوز النبذة ٥٠٠ حرف."),
  }),
  z.object({
    role: z.literal("CLIENT"),
    age: z.number().int().min(13).max(120),
    country: z.string().trim().min(2, "اختر الدولة أو أدخل اسمها."),
    brandLogoUrl: z.string().nullable(),
    brandName: z.string().trim().min(2, "يجب ألا يقل اسم العلامة التجارية عن حرفين."),
    industry: z.string().trim().min(2, "يرجى إدخال مجال عمل صحيح."),
  }),
]);

export type OnboardingValues = z.infer<typeof onboardingSchema>;