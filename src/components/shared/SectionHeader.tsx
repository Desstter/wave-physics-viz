interface Props {
  title: string
  subtitle: string
  color?: string
}

export default function SectionHeader({ title, subtitle, color = 'text-indigo-400' }: Props) {
  return (
    <div className="px-6 pt-6 pb-4 border-b border-gray-800">
      <h1 className={`text-xl font-bold ${color}`}>{title}</h1>
      <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
    </div>
  )
}
