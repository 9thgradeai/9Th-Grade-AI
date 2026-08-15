import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Landmark, Briefcase, GraduationCap, Sparkles } from 'lucide-react'

const icons: Record<string, typeof Shield> = {
  shield: Shield,
  bank: Landmark,
  briefcase: Briefcase,
  graduation: GraduationCap,
  sparkles: Sparkles,
}

export default function Exams() {
  const exams = [
    {
      id: 'bcs',
      slug: 'bcs',
      name: 'BCS',
      shortName: 'বাংলাদেশ সিভিল সার্ভিস',
      tagline: 'Civil Service',
      description: 'বাংলাদেশ সিভিল সার্ভিসের প্রাথমিক পরীক্ষার প্রস্তুতি প্ল্যাটফর্ম।',
      color: '#4f7cff',
      icon: 'shield',
      status: 'active' as const,
    },
    {
      id: 'bank',
      slug: 'bangladesh-bank',
      name: 'Bangladesh Bank',
      shortName: 'বাংলাদেশ ব্যাংক',
      tagline: 'Assistant Director',
      description: 'বাংলাদেশ ব্যাংক এড পরীক্ষার প্রস্তুতি। শীঘ্রই আসছে।',
      color: '#22d3ee',
      icon: 'bank',
      status: 'upcoming' as const,
    },
    {
      id: 'ntrca',
      slug: 'ntrca',
      name: 'NTRCA',
      shortName: 'এনটিআরসিএ',
      tagline: 'Teachers Recruitment',
      description: 'অন-গভর্নমেন্ট টিচার্স রেজিস্ট্রেশন অ্যান্ড সার্টিফিকেশন অথোরিটি। শীঘ্রই আসছে।',
      color: '#34d399',
      icon: 'graduation',
      status: 'upcoming' as const,
    },
    {
      id: '9th',
      slug: '9th-grade',
      name: '৯ম গ্রেড',
      shortName: '৯ম গ্রেড',
      tagline: 'Government Recruitment',
      description: '৯ম গ্রেড সরকারি নিয়োগ পরীক্ষার প্রস্তুতি। শীঘ্রই আসছে।',
      color: '#8b5cf6',
      icon: 'briefcase',
      status: 'upcoming' as const,
    },
    {
      id: 'other',
      slug: 'other',
      name: 'অন্যান্য',
      shortName: 'অন্যান্য',
      tagline: 'Other Competitive',
      description: 'অন্যান্য প্রতিযোগী পরীক্ষার সিলেবাস ও প্রস্তুতি। শীঘ্রই আসছে।',
      color: '#9aa3b8',
      icon: 'sparkles',
      status: 'upcoming' as const,
    },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-32 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-gradient-to-r from-accent to-cyan" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-hi">পরীক্ষাসমূহ</span>
        </div>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
          প্রস্তুতি প্ল্যাটফর্ম
        </h1>
        <p className="mt-4 max-w-xl text-muted">
          বাংলাদেশের সরকারি প্রতিযোগী পরীক্ষার জন্য সম্পূর্ণ প্রস্তুতি সিস্টেম।
        </p>
      </motion.div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {exams.map((e, i) => {
          const Icon = icons[e.icon] ?? Sparkles
          return (
            <motion.div key={e.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Link
                to={`/exams/${e.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-white/8 bg-white/[0.03] p-6 transition-all hover:border-white/20 hover:bg-white/[0.05]"
              >
                <div className="flex items-start justify-between">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-xl border"
                    style={{ borderColor: `${e.color}40`, backgroundColor: `${e.color}14`, color: e.color }}
                  >
                    <Icon size={20} />
                  </span>
                  <span className={`text-[10px] font-mono uppercase tracking-wider ${e.status === 'active' ? 'text-success' : 'text-muted'}`}>
                    {e.status === 'active' ? 'Active' : 'শীঘ্রই আসছে'}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-ink">{e.shortName}</h3>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider text-faint">{e.tagline}</p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{e.description}</p>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
