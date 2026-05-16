import type { DraftRepository } from './draft-repository';

export async function runPackagedDraftSmokeTest(repository: DraftRepository, draftsPath: string): Promise<void> {
  const body = '# Packaged Draft Smoke Test\n\nQwill can create, write, read, and remove a draft from app data.';
  const created = await repository.create('Packaged Draft Smoke Test');

  try {
    await repository.write(created.id, body);

    const readBody = await repository.read(created.id);
    if (readBody !== body) {
      throw new Error('Draft read content did not match written content.');
    }

    const meta = await repository.getMeta(created.id);
    if (meta.title !== 'Packaged Draft Smoke Test' || meta.wordCount === 0) {
      throw new Error('Draft metadata was not refreshed after write.');
    }

    const indexed = repository.list().some((draft) => draft.id === created.id);
    if (!indexed) {
      throw new Error('Written draft was not present in the in-memory index.');
    }

    process.stdout.write(
      `${JSON.stringify(
        {
          ok: true,
          draftsPath,
          draftId: created.id,
          wordCount: meta.wordCount
        },
        null,
        2
      )}\n`
    );
  } finally {
    await repository.delete(created.id).catch(() => undefined);
  }
}
