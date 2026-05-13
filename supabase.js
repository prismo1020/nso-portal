const SUPABASE_URL = 'https://uvbkiudfemyesizvecos.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2YmtpdWRmZW15ZXNpenZlY29zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MjY3MzksImV4cCI6MjA5NDIwMjczOX0._6-wR9OZ-hUFyo0rQ_wig8C65miqpmpclAcz0cxjqu4';

// The CDN already declared a global called 'supabase' (the SDK).
// We overwrite it with the initialised client so all other files can use supabase.from() / supabase.auth.*
window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
