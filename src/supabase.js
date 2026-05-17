import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zzdpumpaoujatexdzufe.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6ZHB1bXBhb3VqYXRleGR6dWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMzUwOTksImV4cCI6MjA5NDYxMTA5OX0.h3K-f0mdbjJFg7mQs3ZF3LEkeamsd2NZ11v8MW1hCB0'

export const supabase = createClient(supabaseUrl, supabaseKey)