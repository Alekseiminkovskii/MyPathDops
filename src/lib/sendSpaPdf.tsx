import { pdf } from '@react-pdf/renderer'
import { supabase } from '../supabaseClient'
import { SPADocument } from '../components/SPADocument'

export async function generateAndSendSpaPdf(job: Parameters<typeof SPADocument>[0]['job'], jsa: Parameters<typeof SPADocument>[0]['jsa']) {
  const blob = await pdf(<SPADocument job={job} jsa={jsa} />).toBlob()

  const path = `${job.id}/${jsa.id}.pdf`
  const { error: uploadError } = await supabase.storage.from('spa-pdfs').upload(path, blob, {
    contentType: 'application/pdf', upsert: true,
  })
  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage.from('spa-pdfs').getPublicUrl(path)

  await supabase.from('jsa').update({
    spa_pdf_url: publicUrl,
    spa_emailed_at: new Date().toISOString(),
  }).eq('id', jsa.id)

  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-spa-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({ pdfUrl: publicUrl, siteName: job.site_name, jobId: job.id }),
  })
  const result = await res.json()
  if (!res.ok) throw new Error(result.error || 'Failed to send email')
  return result as { sent: number }
}
