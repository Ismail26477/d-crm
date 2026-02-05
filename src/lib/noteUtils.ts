// Utility functions to parse notes with timestamps
// Notes are stored as: [Date1] Note1\n\n[Date2] Note2\n\n[Date3] Note3
// This extracts the actual note content from the timestamped format

export function getLastNoteContent(notes: string): string {
  if (!notes) return ""

  // Split by the timestamp pattern [DD MMM YYYY, HH:MM XX]
  const noteEntries = notes.split(/\n\n\[/)

  if (noteEntries.length === 0) return notes

  // Get the last entry and remove the closing bracket if present
  const lastEntry = noteEntries[noteEntries.length - 1]
  const contentAfterBracket = lastEntry.split("]\n")

  if (contentAfterBracket.length > 1) {
    return contentAfterBracket.slice(1).join("]\n").trim()
  }

  return lastEntry.trim()
}

export function getFirstLineOfNotes(notes: string, maxLength = 50): string {
  const lastNote = getLastNoteContent(notes)
  const firstLine = lastNote.split("\n")[0]

  if (firstLine.length > maxLength) {
    return firstLine.substring(0, maxLength) + "..."
  }

  return firstLine
}

export function getAllNoteEntries(notes: string): Array<{ timestamp: string; content: string }> {
  if (!notes) return []

  const entries: Array<{ timestamp: string; content: string }> = []

  // Match pattern [DD MMM YYYY, HH:MM AM/PM]\nContent
  const regex = /\[([^\]]+)\]\n([^[]*?)(?=\n\n\[|$)/gs
  let match

  while ((match = regex.exec(notes)) !== null) {
    entries.push({
      timestamp: match[1],
      content: match[2].trim(),
    })
  }

  return entries
}
