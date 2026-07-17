import { createClient } from '@supabase/supabase-js';

// MARIEL'LA vive como "tenant" (tablas mariella_*) dentro del proyecto Supabase
// volea-web: el proyecto original MARIELLA quedó pausado por el límite de 2
// proyectos activos del plan free. La anon key es pública por diseño (viaja en
// el bundle); la seguridad real la dan las políticas RLS (escritura solo admin).
const SUPABASE_URL = 'https://scftuxrtflfowohiewsc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjZnR1eHJ0Zmxmb3dvaGlld3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NDgyMjAsImV4cCI6MjA5NTMyNDIyMH0.F9n9X_urG0O0Oo2vTI_S8LcRWR93girs1e4eZb8bWUI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // Clave propia para no chocar con otras apps del mismo origen en desarrollo
    storageKey: 'mariella-auth',
  },
});
