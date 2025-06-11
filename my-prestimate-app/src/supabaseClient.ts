import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://kmmkfdoyehmjnxfbisxo.supabase.co',
'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttbWtmZG95ZWhtam54ZmJpc3hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0ODk3MzMsImV4cCI6MjA2NDA2NTczM30.50cLLw7muIHarMgkbQsD-Sg0M5hqL20mY5p3Do55SHY');