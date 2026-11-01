export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && !/\.(?:[cm]?js|[cm]?ts|json)$/.test(specifier)) {
    try {
      return await nextResolve(`${specifier}.ts`, context);
    } catch {
      // Deixa o resolvedor padrão emitir o erro com a localização original.
    }
  }
  return nextResolve(specifier, context);
}
