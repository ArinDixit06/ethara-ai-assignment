/**
 * Generates a clean, unique SKU based on category and product names.
 * Format: CAT-PROD-RANDOM (e.g. ELE-MOBI-A4F2)
 */
export const generateSKU = (categoryName: string, productName: string): string => {
  const cat = (categoryName || 'GEN')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 3)
    .padEnd(3, 'X');
    
  const prod = (productName || 'PRD')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4)
    .padEnd(4, 'X');

  const rand = Math.random().toString(36).substring(2, 6).toUpperCase().padEnd(4, '0');
  
  return `${cat}-${prod}-${rand}`;
};

export default generateSKU;
