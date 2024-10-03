const stringRemoveAccents = (string) => {
  return string.normalize("NFD").replace(/[\u0300-\u036F]/g, "");
};

export function cleanString(string) {
  // elimina lo que no sea, letra, numero o guion bajo
  let cleanString = stringRemoveAccents(string);
  cleanString = cleanString.trim().replace(/[^\w\d\sñ_]/g, "");
  // espacios por guion bajo
  cleanString = cleanString.replaceAll(/ /g, "_");
  return cleanString;
}

export const getCleanTitle = (string) => {
  if (!string) return "";
  return cleanString(string).toLowerCase();
};
