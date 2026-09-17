import type { Lesson } from '../schema';

/**
 * Lesson bodies are code-split: each file in ./<moduleId>/<lessonId>.ts is its
 * own chunk and loads only when the lesson is opened.
 */
const loaders = import.meta.glob<{ default: Lesson }>('./*/*.ts');

function key(moduleId: string, lessonId: string) {
  return `./${moduleId}/${lessonId}.ts`;
}

export function hasLessonContent(moduleId: string, lessonId: string): boolean {
  return key(moduleId, lessonId) in loaders;
}

export async function loadLesson(moduleId: string, lessonId: string): Promise<Lesson | undefined> {
  const loader = loaders[key(moduleId, lessonId)];
  if (!loader) return undefined;
  const mod = await loader();
  return mod.default;
}
