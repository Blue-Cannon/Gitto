export function checkLineEndings(content) {
  const hasCRLF = content.includes('\r\n');
  const hasLF = /(?<!\r)\n/.test(content);
  const hasCR = /\r(?!\n)/.test(content);

  if ((hasCRLF && hasLF) || (hasCR && hasLF) || (hasCR && hasCRLF)) {
    return {
      mixed: true,
      message: "Gitto targeted this file has mixed line endings. We are saying to normalize them to LF! Thank You."
    };
  }
  return { mixed: false };
}

export function normalize(content) {
  return content.replace(/\r\n|\r|\n/g, '\n');
}
