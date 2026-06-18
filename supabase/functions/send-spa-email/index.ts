// Deploy: supabase functions deploy send-spa-email
// Secret:  supabase secrets set RESEND_API_KEY=<your Resend API key>
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Missing Authorization header' }, 401)

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  const token = authHeader.replace('Bearer ', '')

  const { data: { user }, error: userError } = await supabase.auth.getUser(token)
  if (userError || !user) return json({ error: 'Invalid session' }, 401)

  const { data: callerProfile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (callerProfile?.role !== 'safety_manager' && callerProfile?.role !== 'pm') {
    return json({ error: 'Only safety managers or PMs can send SPA emails' }, 403)
  }

  const { pdfUrl, siteName, jobId } = await req.json()
  if (!pdfUrl || !siteName) return json({ error: 'Missing pdfUrl or siteName' }, 400)

  const { data: pms, error: pmError } = await supabase
    .from('profiles').select('email').eq('role', 'pm')
  if (pmError) return json({ error: pmError.message }, 500)

  const emails = (pms ?? []).map(p => p.email).filter(Boolean)
  if (emails.length === 0) return json({ sent: 0 })

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'MyPathDops <onboarding@resend.dev>',
      to: emails,
      subject: `SPA Approved — ${siteName}`,
      html: `<p>The Daily Safe Plan of Action for <strong>${siteName}</strong> (Job #${jobId}) has been approved by the Safety Manager.</p><p><a href="${pdfUrl}">View the PDF</a></p>`,
    }),
  })

  if (!resendRes.ok) {
    const text = await resendRes.text()
    return json({ error: `Resend error: ${text}` }, 502)
  }

  return json({ sent: emails.length })
})
