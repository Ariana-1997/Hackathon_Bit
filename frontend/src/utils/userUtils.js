/**
 * Extrae las iniciales de un nombre para mostrar como avatar predeterminado
 * Ejemplos:
 * "Carlos Mendoza" -> "CM"
 * "Carlos Mendoza" -> "CM"
 * "Elena" -> "EL"
 * "Doña Rosa Quispe" -> "DQ"
 */
export function getInitials(name) {
  if (!name || typeof name !== 'string') return 'V';
  const clean = name.trim();
  if (!clean) return 'V';
  
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  // Toma la inicial del primer nombre y del apellido
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
