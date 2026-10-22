import { ArrowRight, Play, ShieldCheck, Smartphone, Star } from "lucide-react";
import { motion } from "motion/react";
import { Fragment } from "react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/ugc-hero.svg";
import { AnimatedChar } from "./AnimatedChar";

const headline = "Welcome to UGC Marketplace";
const visibleCharacterCount = headline.replaceAll(" ", "").length;
const headlineWords = headline.split(" ").reduce<Array<{ word: string; startIndex: number }>>((words, word) => {
  const startIndex = words.length ? words[words.length - 1].startIndex + words[words.length - 1].word.length : 0;
  words.push({ word, startIndex });
  return words;
}, []);

export function Hero() {
  return (
    <section className="relative min-h-[680px] overflow-hidden bg-ink-950 text-white lg:min-h-[760px]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_30%,rgba(124,58,237,.34),transparent_46%),radial-gradient(ellipse_at_10%_90%,rgba(217,70,239,.18),transparent_40%)]" />
      <div className="relative mx-auto grid min-h-[680px] max-w-7xl items-center gap-10 px-5 pb-12 pt-28 sm:px-6 lg:min-h-[760px] lg:grid-cols-[1.05fr_.95fr] lg:gap-14 lg:px-10 lg:pb-16 lg:pt-32">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-violet-100"><span className="h-2 w-2 rounded-full bg-emerald-400" /> سوق صنّاع المحتوى المصمم للعلامات التجارية</p>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="mt-7 max-w-2xl"
          >
            <motion.h1
              dir="ltr"
              lang="en"
              aria-label={headline}
              className="m-0 text-left text-4xl font-extrabold leading-[1.25] text-white sm:text-5xl lg:text-7xl"
            >
              {headlineWords.map(({ word, startIndex }, wordIndex) => (
                <Fragment key={`${word}-${wordIndex}`}>
                  {wordIndex > 0 && " "}
                  <span className="inline-block whitespace-nowrap">
                    {Array.from(word, (char, index) => (
                      <AnimatedChar key={index} char={char} index={startIndex + index} characterCount={visibleCharacterCount} />
                    ))}
                  </span>
                </Fragment>
              ))}
            </motion.h1>
          </motion.div>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/65">اكتشف صنّاع محتوى موثوقين، وتصفّح أعمالهم المميزة، وانطلق بحملتك القادمة. يراجع فريقنا كل طلب ويتولى تنسيقه.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to="/auth" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-600 px-7 py-3 font-semibold text-white transition hover:bg-brand-500">اكتشف صانع المحتوى <ArrowRight size={17} /></Link>
            <Link to="/auth" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 bg-white/5 px-7 py-3 font-semibold text-white transition hover:bg-white/10">انضم كصانع محتوى</Link>
          </div>
          <div className="mt-9 flex flex-wrap items-center gap-5 text-sm text-white/65">
            <div className="flex items-center gap-1 text-amber-300">{Array.from({ length: 5 }, (_, i) => <Star key={i} size={16} fill="currentColor" />)}<span className="mr-2 text-white/70">إبداع يليق بعلامتك التجارية</span></div>
          </div>
        </div>
        <motion.div className="relative mx-auto w-full max-w-lg" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>
          <div className="absolute -inset-5 rounded-[3rem] bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 blur-2xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/5 p-3 shadow-2xl">
            <img src={heroImage} alt="مشهد إبداعي لتصوير محتوى منتجات احترافي" className="h-[300px] w-full rounded-[1.5rem] object-cover sm:h-[420px] lg:h-[500px]" />
            <div className="absolute right-7 top-8 flex items-center gap-2 rounded-2xl border border-white/15 bg-ink-900/85 px-4 py-3 text-sm shadow-xl backdrop-blur"><ShieldCheck className="text-emerald-400" size={18} /> أعمال معتمدة</div>
            <div className="absolute bottom-8 left-7 flex items-center gap-2 rounded-2xl border border-white/15 bg-ink-900/85 px-4 py-3 text-sm shadow-xl backdrop-blur"><Smartphone className="text-fuchsia-300" size={18} /> فيديو عمودي 9:16</div>
            <div className="absolute bottom-24 right-7 flex items-center gap-2 rounded-2xl border border-white/15 bg-ink-900/85 px-4 py-3 text-sm shadow-xl backdrop-blur"><Play className="text-amber-300" size={17} /> أعمال جاهزة لحملتك</div>
          </div>
        </motion.div>
      </div>
      <div id="how-it-works" className="relative border-t border-white/10 bg-white/[0.03]">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 text-sm text-white/70 sm:grid-cols-3 lg:px-10">
          <p><span className="ml-2 font-bold text-white">١</span> تصفّح أعمال صنّاع المحتوى المعتمدة</p>
          <p><span className="ml-2 font-bold text-white">٢</span> أرسل طلب حملتك في باقة واحدة</p>
          <p><span className="ml-2 font-bold text-white">٣</span> يتولى فريقنا تنسيق التنفيذ</p>
        </div>
      </div>
    </section>
  );
}