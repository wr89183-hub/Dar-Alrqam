const SUPABASE_URL = 'https://cuxpxtfrjdohdsfytohq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eHB4dGZyamRvaGRzZnl0b2hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MjYwNjIsImV4cCI6MjA5MTQwMjA2Mn0.HfxEkfs0cfDwmD36NWE607jHwNo7T7U129hBAEB3j-E';

window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

// Initialize the Supabase client
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
