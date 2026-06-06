const fs = require('fs');
const path = require('path');

const classTsPath = path.join(__dirname, 'src', 'generated', 'prisma', 'internal', 'class.ts');

if (fs.existsSync(classTsPath)) {
  let content = fs.readFileSync(classTsPath, 'utf8');
  
  // Replace the dynamic imports that Next.js Turbopack trips over,
  // since MongoDB Prisma connector doesn't have WebAssembly files.
  content = content.replace(
    /getRuntime:\s*async\s*\(\)\s*=>\s*await\s*import\("[^"]+"\)/g,
    'getRuntime: async () => undefined'
  );
  
  content = content.replace(
    /getQueryCompilerWasmModule:\s*async\s*\(\)\s*=>\s*\{[\s\S]*?return\s*await\s*decodeBase64AsWasm\(wasm\)\n\s*\}/g,
    'getQueryCompilerWasmModule: async () => {\n    return undefined\n  }'
  );
  
  fs.writeFileSync(classTsPath, content, 'utf8');
  console.log('✅ Patched Prisma generated class.ts for MongoDB Turbopack compatibility.');
}
