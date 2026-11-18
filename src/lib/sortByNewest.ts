function timestampFromId(id: string) {
  const match = id.match(/(?:^|[-_])(\d{13})(?:$|[-_])/)
  return match ? Number(match[1]) : 0
}

export function sortByNewest<T extends { id: string; createdAt: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => {
    const aCreatedAt = Date.parse(a.createdAt)
    const bCreatedAt = Date.parse(b.createdAt)
    const byCreatedAt = (Number.isNaN(bCreatedAt) ? 0 : bCreatedAt) - (Number.isNaN(aCreatedAt) ? 0 : aCreatedAt)

    return byCreatedAt || timestampFromId(b.id) - timestampFromId(a.id)
  })
}
