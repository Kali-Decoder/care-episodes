import ReportPageClient from './ReportPageClient'

export function generateStaticParams() {
  return [{ simId: 'sim-urban-asthma' }]
}

export default function Page() {
  return <ReportPageClient />
}
