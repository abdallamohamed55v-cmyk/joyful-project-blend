# خطة نظام السلايدس الجديد (Megsy Illustrated Deck)

ده طلب كبير جداً، فهنقسمه على مراحل عشان نضمن كل خطوة شغاله قبل التانيه.

## الوضع الحالي
- النظام فيه نوعين من القوالب:
  - **Premium**: قوالب HTML داخليه في `public/templates/{slug}/index.html` (20 قالب)، بترسم بـ`SlidesHtmlDeckCard` اللي بياخد محتوى من الـAI ويحطه بنفس style القالب.
  - **Standard**: قوالب خارجيه iframe من `docs-design-studio.lovable.app` (10 قوالب)، بترسم بـ`StandardSlidesCard`.
- صور الـ88 من ملف الـPDF متنسخه فعلاً في `src/assets/slides/critical-thinking/`.

## المرحله 1 — التنظيف (هخلصها دلوقتي)
1. حذف `STANDARD_TEMPLATES` من `src/lib/slidesTemplates.ts`.
2. حذف `src/components/chat/StandardSlidesCard.tsx`.
3. حذف الـimport والـrender block الخاص بيه من `ChatPage.tsx` (lines 40 و 2846–2857).
4. حقل `standardSlides` على رسائل المساعد يبقى ميتوبعش بس مش هنشيله من النوع عشان مايبوظش الـDB.

## المرحله 2 — قالب Megsy Illustrated الأول (Cover + 2 صفحات)
هنبني قالب premium جديد اسمه `premium-megsy-illustrated` بنفس style ال PDF:
- لون: بيج `#E5DACF` + أسود `#000000`
- خط: Mali للعناوين، Rubik للنص
- موقع: `public/templates/megsy-illustrated-deck/index.html`
- محتوى: 3 صفحات بس كنموذج (Cover, Table of Contents, Section divider)
- صور: من `src/assets/slides/critical-thinking/` تتنسخ لـ`public/templates/megsy-illustrated-deck/assets/`

بعد تأكيدك إن الـcover شغال، نكمل الـ17 صفحه الباقيه.

## المرحله 3 — اختبارات E2E (Playwright)
- بما إن الـE2E يحتاج تسجيل دخول بحساب `support@megsyai.com` ويتحرك في الـchat ويولّد slides، ده هيتطلب:
  - Playwright config + auth helper (موجود `tests/` و `playwright` فعلاً في package.json).
  - 3 سيناريوهات لكل قالب: واحد عن Megsy، واحد عام، واحد فارغ.
  - بعد التشغيل، screenshot للسلايد الأولى → يتحفظ كـ `public/templates/{slug}/preview.jpg` → يبقى ال thumbnail للقالب.

## المرحله 4 — إنشاء بقية الـ19 قالب
بعد ما المرحلتين 2 و 3 تشتغلوا تمام، نكرر النمط للسلايدس الباقيه. ده هياخد عدة dosed turns.

## المرحله 5 — توليد الشخصيات بالـAI
- لو احتجنا شخصيات جديده، نستخدم Lovable AI Gateway مع موديل `google/gemini-3.1-flash-image-preview` (Nano Banana 2) عن طريق edge function يولّد بنفس style رسومات الـPDF.

## السؤال
**هابدأ بالمرحله 1 + المرحله 2 (3 صفحات نموذج فقط) دلوقتي، وأوقف بعد كده عشان تشوف النتيجه قبل ما نكمل؟**

ده عشان لو في تعديل على الفكره أو الـstyle، ما يبقاش لازم نعيد شغل 20 قالب.
