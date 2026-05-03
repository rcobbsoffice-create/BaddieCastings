import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://pefaveyeqymfyqpncngq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZmF2ZXllcXltZnlxcG5jbmdxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjMwNTQ2MiwiZXhwIjoyMDkxODgxNDYyfQ.0TkmkFRtHbzbkM4ZIoq4DpEdqhWpfwyvYdww4uCIwsM'
);

const data = fs.readFileSync('./raw_meta.txt', 'utf8');
const lines = data.split('\n');

async function migrate() {
  console.log(`Processing ${lines.length} lines...`);
  
  for (let line of lines) {
    if (!line.includes('|')) continue;
    
    const [wpId, meta] = line.split('|');
    
    // Extract labels and values using a more robust regex
    const fields = {};
    
    // PHP serialized strings are like s:LEN:"CONTENT";
    // We want the label and value pairs.
    // In this specific plugin, they appear as blocks.
    const labelRegex = /s:11:\"field_label\";s:\d+:\"(.*?)\";/g;
    const valueRegex = /s:11:\"field_value\";s:\d+:\"(.*?)\";/g;
    
    let labelMatch;
    while ((labelMatch = labelRegex.exec(meta)) !== null) {
        const label = labelMatch[1];
        // The value follows the label in the serialized string
        // We find the next value after this label position
        const remaining = meta.substring(labelMatch.index + labelMatch[0].length);
        const valueMatch = remaining.match(/s:11:\"field_value\";s:\d+:\"(.*?)\";/);
        
        if (valueMatch) {
            fields[label] = valueMatch[1];
        }
    }

    if (Object.keys(fields).length === 0) continue;

    const email = fields['Email?'] || fields['Email'] || fields['What\'s Your Email?'] || '';

    const { error } = await supabase
      .from('form_submissions')
      .update({ fields, email: email || undefined })
      .eq('wp_id', parseInt(wpId));

    if (error) console.error(`Error updating ${wpId}:`, error.message);
    else console.log(`Updated ${wpId} with ${Object.keys(fields).length} fields.`);
  }
  
  console.log('Done!');
}

migrate();
