import React from "react";

/**
 * Simple markdown parser for chat messages
 * Supports basic formatting like **bold**, *italic*, `code`, and lists
 */

export const parseBasicMarkdown = (text: string): React.ReactNode[] => {
  const lines = text.split("\n");
  const result: React.ReactNode[] = [];

  // Group consecutive list items
  let currentList: string[] = [];
  let listIndex = 0;

  lines.forEach((line, lineIndex) => {
    // Check if this line is a list item
    const listMatch = line.trim().match(/^[•*-]\s+(.+)$/);

    if (listMatch) {
      currentList.push(listMatch[1]);
    } else {
      // If we have accumulated list items, render them
      if (currentList.length > 0) {
        if (result.length > 0) {
          result.push(<br key={`br-before-list-${listIndex}`} />);
        }

        result.push(
          <ul
            key={`list-${listIndex++}`}
            style={{ margin: "8px 0", paddingLeft: "16px" }}
          >
            {currentList.map((item, itemIndex) => (
              <li key={`item-${itemIndex}`} style={{ margin: "4px 0" }}>
                {parseMarkdownLine(item, `${lineIndex}-${itemIndex}`)}
              </li>
            ))}
          </ul>
        );

        currentList = [];
      }

      // Add line break for non-first lines
      if (lineIndex > 0 && result.length > 0) {
        result.push(<br key={`br-${lineIndex}`} />);
      }

      // Parse regular line
      if (line.trim()) {
        const parsedLine = parseMarkdownLine(line, lineIndex);
        result.push(...parsedLine);
      }
    }
  });

  // Handle any remaining list items
  if (currentList.length > 0) {
    if (result.length > 0) {
      result.push(<br key={`br-before-final-list`} />);
    }

    result.push(
      <ul key={`final-list`} style={{ margin: "8px 0", paddingLeft: "16px" }}>
        {currentList.map((item, itemIndex) => (
          <li key={`final-item-${itemIndex}`} style={{ margin: "4px 0" }}>
            {parseMarkdownLine(item, `final-${itemIndex}`)}
          </li>
        ))}
      </ul>
    );
  }

  return result;
};

const parseMarkdownLine = (
  line: string,
  lineKey: string | number
): React.ReactNode[] => {
  const result: React.ReactNode[] = [];
  let position = 0;
  let segmentIndex = 0;

  while (position < line.length) {
    // Try to find the next markdown pattern
    const boldMatch = findNextPattern(line, position, /\*\*(.*?)\*\*/g);
    const codeMatch = findNextPattern(line, position, /`([^`]+)`/g);
    const italicMatch = findNextPattern(
      line,
      position,
      /\*([^*\s][^*]*[^*\s]|\S)\*/g
    );

    // Find the earliest match
    const matches = [boldMatch, codeMatch, italicMatch].filter(
      Boolean
    ) as MarkdownMatch[];
    if (matches.length === 0) {
      // No more patterns, add remaining text
      const remaining = line.substring(position);
      if (remaining) {
        result.push(remaining);
      }
      break;
    }

    const nextMatch = matches.reduce((earliest, current) =>
      current.index < earliest.index ? current : earliest
    );

    // Add text before the match
    if (nextMatch.index > position) {
      const textBefore = line.substring(position, nextMatch.index);
      result.push(textBefore);
    }

    // Add the formatted element
    const formatKey = `${lineKey}-fmt-${segmentIndex++}`;
    if (nextMatch === boldMatch) {
      result.push(<strong key={formatKey}>{nextMatch.content}</strong>);
    } else if (nextMatch === codeMatch) {
      result.push(<code key={formatKey}>{nextMatch.content}</code>);
    } else if (nextMatch === italicMatch) {
      result.push(<em key={formatKey}>{nextMatch.content}</em>);
    }

    position = nextMatch.index + nextMatch.length;
  }

  return result.length > 0 ? result : [line];
};

interface MarkdownMatch {
  index: number;
  length: number;
  content: string;
}

const findNextPattern = (
  text: string,
  startPos: number,
  regex: RegExp
): MarkdownMatch | null => {
  regex.lastIndex = 0; // Reset regex
  const searchText = text.substring(startPos);
  const match = regex.exec(searchText);

  if (match) {
    return {
      index: startPos + match.index,
      length: match[0].length,
      content: match[1],
    };
  }

  return null;
};

/**
 * Alternative simple implementation using dangerouslySetInnerHTML
 * Use this if the above is too complex
 */
export const parseSimpleMarkdown = (text: string): string => {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(
      /`(.*?)`/g,
      '<code style="background-color: #f1f3f4; padding: 2px 4px; border-radius: 3px; font-family: monospace; font-size: 0.9em;">$1</code>'
    )
    .replace(/\n/g, "<br>");
};
