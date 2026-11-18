import {
  DocumentReference,
  SetOptions,
  setDoc,
  updateDoc,
  addDoc,
  CollectionReference,
  DocumentData,
} from 'firebase/firestore';

/**
 * Recursively removes all keys with `undefined` values from an object or array.
 * Preserves `null`, primitives, Dates, and Firestore FieldValues (such as serverTimestamp) / Timestamps.
 *
 * This ensures that Firestore `setDoc`, `updateDoc`, and `addDoc` operations never fail
 * with "Unsupported field value: undefined" errors without relying on global ignore flags.
 */
export function removeUndefinedFields<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value !== 'object') {
    return value;
  }

  // Handle Arrays: remove undefined items and sanitize nested items
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => removeUndefinedFields(item)) as unknown as T;
  }

  // Preserve Date instances
  if (value instanceof Date) {
    return value;
  }

  // Preserve Firestore FieldValues (serverTimestamp, deleteField, arrayUnion, increment)
  // and Firestore Timestamps
  const candidate = value as Record<string, unknown>;
  const isFirestoreSentinel =
    Boolean(candidate._methodName) ||
    typeof candidate.toMillis === 'function' ||
    typeof candidate.isEqual === 'function';

  if (isFirestoreSentinel) {
    return value;
  }

  // Plain object: omit keys whose value is undefined
  const cleaned: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(candidate)) {
    if (val !== undefined) {
      const nestedCleaned = removeUndefinedFields(val);
      if (nestedCleaned !== undefined) {
        cleaned[key] = nestedCleaned;
      }
    }
  }

  return cleaned as T;
}

/**
 * Firestore-safe setDoc wrapper that automatically strips `undefined` fields.
 */
export async function safeSetDoc<T extends DocumentData>(
  reference: DocumentReference<T>,
  data: Partial<T> | T,
  options?: SetOptions
): Promise<void> {
  const sanitized = removeUndefinedFields(data);
  if (options) {
    await setDoc(reference, sanitized as any, options);
  } else {
    await setDoc(reference, sanitized as any);
  }
}

/**
 * Firestore-safe updateDoc wrapper that automatically strips `undefined` fields.
 */
export async function safeUpdateDoc<T extends DocumentData>(
  reference: DocumentReference<T>,
  data: Partial<T>
): Promise<void> {
  const sanitized = removeUndefinedFields(data);
  await updateDoc(reference, sanitized as any);
}

/**
 * Firestore-safe addDoc wrapper that automatically strips `undefined` fields.
 */
export async function safeAddDoc<T extends DocumentData>(
  reference: CollectionReference<T>,
  data: T
): Promise<DocumentReference<T>> {
  const sanitized = removeUndefinedFields(data);
  return await addDoc(reference, sanitized as any);
}
