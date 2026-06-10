const fs = require('fs');
const path = require('path');

// Raíz de /front
const dotenvPath = path.join(__dirname, '.env');
const targetDir = path.join(__dirname, 'src', 'environments');

// Valores por defecto
let apiUrl = 'https://ajpd-api.onrender.com';

// Leer .env si existe
if (fs.existsSync(dotenvPath)) {
  const dotenvContent = fs.readFileSync(dotenvPath, 'utf8');
  const match = dotenvContent.match(/^API_URL\s*=\s*(.+)$/m);
  if (match && match[1]) {
    apiUrl = match[1].trim();
  }
}

// Crear la carpeta de entornos si no existe
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const envFileContent = `export const environment = {
  production: true,
  apiUrl: '${apiUrl}'
};
`;

const devEnvFileContent = `export const environment = {
  production: false,
  apiUrl: '${apiUrl}'
};
`;

fs.writeFileSync(path.join(targetDir, 'environment.ts'), envFileContent);
fs.writeFileSync(path.join(targetDir, 'environment.development.ts'), devEnvFileContent);

console.log('Entornos generados con éxito con API_URL:', apiUrl);
