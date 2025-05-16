// Script to add dynamic export to all API routes using getServerSession
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

// List of files to update (gathered from the grep search results)
const filesToUpdate = [
  'src/app/api/services/route.ts',
  'src/app/api/stripe/connect/route.ts',
  'src/app/api/invitations/[token]/google/route.ts',
  'src/app/api/user/booking-link/route.ts',
  'src/app/api/admin/invitations/route.ts',
  'src/app/api/user/[userId]/chatbot/assistant/route.ts',
  'src/app/api/appointments/available-slots/route.ts',
  'src/app/api/appointments/[id]/details/route.ts',
  'src/app/api/appointments/[id]/route.ts',
  'src/app/api/bookings/[id]/route.ts',
  'src/app/api/appointments/[id]/reschedule/route.ts',
  'src/app/api/user/booking-calendar/route.ts',
  'src/app/api/admin/invitations/[id]/resend/route.ts',
  'src/app/api/bookings/deposit/route.ts',
  'src/app/api/settings/business-name/route.ts'
];

async function updateFile(filePath) {
  try {
    // Read the file content
    const fileContent = await readFileAsync(filePath, 'utf8');
    
    // Check if the file already has the dynamic export
    if (fileContent.includes("export const dynamic = 'force-dynamic'")) {
      console.log(`${filePath} already has dynamic export, skipping...`);
      return;
    }
    
    // Find all import statements
    const importStatements = fileContent.match(/import.*?;(\n|\r\n)+/g) || [];
    
    // If there are imports, add the dynamic export after the last import
    if (importStatements.length > 0) {
      const lastImport = importStatements[importStatements.length - 1];
      const lastImportIndex = fileContent.lastIndexOf(lastImport) + lastImport.length;
      
      // Insert the dynamic export after the last import
      const updatedContent = [
        fileContent.slice(0, lastImportIndex),
        "\nexport const dynamic = 'force-dynamic';\n",
        fileContent.slice(lastImportIndex)
      ].join('');
      
      // Write the updated content back to the file
      await writeFileAsync(filePath, updatedContent, 'utf8');
      console.log(`Updated ${filePath} successfully`);
    } else {
      console.log(`No imports found in ${filePath}, skipping...`);
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error);
  }
}

async function main() {
  console.log('Updating API routes with dynamic export...');
  
  for (const filePath of filesToUpdate) {
    await updateFile(filePath);
  }
  
  console.log('Update completed!');
}

main().catch(console.error); 