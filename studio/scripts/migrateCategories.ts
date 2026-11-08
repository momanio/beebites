import { mkdirSync, writeFileSync } from 'node:fs'
import { getCliClient } from 'sanity/cli'
import {
  buildCategoryMigration,
  type MigrationDocument,
} from '../migrations/categoryHierarchy.ts'

async function main() {
  const client = getCliClient({
    apiVersion: '2026-01-01',
    perspective: 'raw',
    useCdn: false,
  })
  const documents = await client.fetch<MigrationDocument[]>(
    '*[_type in ["category", "product"]]',
  )
  const plan = buildCategoryMigration(documents)
  console.log(
    JSON.stringify(
      {
        mode: process.argv.includes('--apply') ? 'apply' : 'dry-run',
        categoriesToCreate: plan.creates.map(({ _id, title, parent }) => ({
          _id,
          title,
          parent: parent?._ref ?? null,
        })),
        documentsToUpdate: plan.updates.length,
        categoryIds: plan.categoryIds,
      },
      null,
      2,
    ),
  )

  if (!process.argv.includes('--apply')) return
  if (!plan.creates.length && !plan.updates.length) {
    console.log('Categories and product references are already up to date.')
    return
  }
  if (!client.config().token)
    throw new Error('A Sanity login is required. Run sanity login, then retry.')
  mkdirSync(new URL('../../test-results/', import.meta.url), {
    recursive: true,
  })
  const backup = new URL(
    `../../test-results/category-backup-${Date.now()}.json`,
    import.meta.url,
  )
  writeFileSync(backup, JSON.stringify(documents, null, 2) + '\n')
  let transaction = client.transaction()
  for (const category of plan.creates)
    transaction = transaction.createIfNotExists(category)
  for (const update of plan.updates) {
    transaction = transaction.patch(update.id, (patch) => {
      let next = patch.ifRevisionId(update.revision)
      if (Object.keys(update.set).length) next = next.set(update.set)
      if (update.unset.length) next = next.unset(update.unset)
      return next
    })
  }
  await transaction.commit()
  console.log(`Category hierarchy migrated. Backup saved to ${backup.pathname}`)
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : 'Category migration failed',
  )
  process.exitCode = 1
})
