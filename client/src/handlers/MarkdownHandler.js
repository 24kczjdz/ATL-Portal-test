import React from 'react';

/**
 * Unified markdown handler for rendering formatted text across the application.
 * Combines features from both ChatBot and TrajectoryMap implementations,
 * defaulting to TrajectoryMap's design when conflicts arise.
 * 
 * @param {string} text - The text to be rendered
 * @param {Object} options - Configuration options
 * @param {boolean} [options.isBot=true] - Whether the text is from a bot (affects styling)
 * @param {boolean} [options.showFullContent=false] - Whether to show the full content or truncate
 * @param {boolean} [options.toggleDarkHeader=false] - Whether to use dark styling for headers
 * @param {number} [options.charLimit=Infinity] - Maximum number of characters to show before truncating
 * @returns {JSX.Element} - Rendered markdown content
 */
export const renderMarkdown = (text, options = {}) => {
  const {
    isBot = true,
    showFullContent = false,
    toggleDarkHeader = false,
    charLimit = Infinity
  } = options;

  // Process text for character limit
  let processedText = text;
  if (!showFullContent && charLimit !== Infinity) {
    // Split into sections first
    const sections = text.split('\n\n');
    let remainingChars = charLimit;
    let resultText = '';
    
    for (const section of sections) {
      const lines = section.split('\n');
      let sectionText = '';
      let sectionFits = true;
      
      for (const line of lines) {
        // Check if this is a header
        const isHeader = line.startsWith('**') && line.endsWith('**');
        const isBulletPoint = /^[-*]\s/.test(line);
        const isNumberedList = /^\d+\./.test(line);
        
        if (isHeader) {
          // For headers, check if we have enough characters left
          if (line.length <= remainingChars) {
            sectionText += line + '\n';
            remainingChars -= line.length + 1; // +1 for the newline
          } else {
            // If we can't fit the header, try to fit at least part of the section
            sectionFits = false;
            break;
          }
        } else if (isBulletPoint || isNumberedList) {
          // For bullet points and numbered lists, check if we have enough characters left
          if (line.length <= remainingChars) {
            sectionText += line + '\n';
            remainingChars -= line.length + 1;
          } else {
            // If we can't fit the bullet point or numbered list, skip it
            sectionFits = false;
            break;
          }
        } else {
          // For normal text, add as much as we can
          if (line.length <= remainingChars) {
            sectionText += line + '\n';
            remainingChars -= line.length + 1;
          } else {
            // Find the last space before the character limit
            const lastSpaceIndex = line.substring(0, remainingChars).lastIndexOf(' ');
            if (lastSpaceIndex > 0) {
              // Check if the truncated part ends with a special format
              const truncatedPart = line.substring(0, lastSpaceIndex);
              const isLastWordSpecial = /^[-*]\s|\d+\.$/.test(truncatedPart.trim());
              
              if (isLastWordSpecial) {
                // If the last word is special, find the previous space
                const prevSpaceIndex = truncatedPart.substring(0, lastSpaceIndex - 1).lastIndexOf(' ');
                if (prevSpaceIndex > 0) {
                  sectionText += line.substring(0, prevSpaceIndex) + '...';
                } else {
                  // If no previous space found, skip this line
                  sectionFits = false;
                  break;
                }
              } else {
                sectionText += truncatedPart + '...';
              }
            } else {
              // If no space found, skip this line
              sectionFits = false;
              break;
            }
            remainingChars = 0;
            sectionFits = false;
            break;
          }
        }
      }
      
      // Add the processed section if we have characters left
      if (sectionText) {
        if (sectionFits) {
          resultText += sectionText + '\n';
          remainingChars -= 1; // For the section separator
        } else {
          // If section doesn't fit completely, add what we have and stop
          resultText += sectionText;
          break;
        }
      }
      
      if (remainingChars <= 0) break;
    }
    
    // If we have no content at all, return at least the first part of the text
    if (!resultText.trim()) {
      // Find the last space before the character limit
      const lastSpaceIndex = text.substring(0, charLimit).lastIndexOf(' ');
      if (lastSpaceIndex > 0) {
        // Check if the truncated part ends with a special format
        const truncatedPart = text.substring(0, lastSpaceIndex);
        const isLastWordSpecial = /^[-*]\s|\d+\.$/.test(truncatedPart.trim());
        
        if (isLastWordSpecial) {
          // If the last word is special, find the previous space
          const prevSpaceIndex = truncatedPart.substring(0, lastSpaceIndex - 1).lastIndexOf(' ');
          if (prevSpaceIndex > 0) {
            resultText = text.substring(0, prevSpaceIndex) + '...';
          } else {
            resultText = text.substring(0, charLimit) + '...';
          }
        } else {
          resultText = truncatedPart + '...';
        }
      } else {
        resultText = text.substring(0, charLimit) + '...';
      }
    }
    
    // Remove trailing newlines and update processedText
    processedText = resultText.trim();
  }

  const textColor = isBot ? 'text-gray-900 dark:text-white' : 'text-white';
  const headingColor = isBot ? 'text-blue-600 dark:text-blue-400' : (toggleDarkHeader ? textColor : 'text-blue-300');

  const renderLine = (line, lineIndex, isFirstLine = false) => {
    // Helper function to determine if this is a title/subtitle
    const isTitle = line.includes('__') && /^(.*)__(.+?)__(.*)$/.test(line);
    const isSubtitle = line.startsWith('**') && line.endsWith('**');
    
    // Add extra margin top for titles and subtitles (except first line)
    const extraMarginClass = !isFirstLine && (isTitle || isSubtitle) ? 'mt-4' : '';

    // Handle bullet points (both * and -)
    if (/^[-*]\s/.test(line)) {
      const bullet = line.charAt(0);
      const content = line.slice(2);
      const indent = line.match(/^\s*/)[0].length;
      
      return (
        <div key={lineIndex} className={`mb-1 ${extraMarginClass}`} style={{ marginLeft: `${indent * 1.5}rem` }}>
          <span className="font-medium mr-2">
            {bullet === '*' ? (
              <span className={`${textColor}`}>‣</span>
            ) : (
              <span className={`${textColor}`}>●</span>
            )}
          </span>
          {renderBoldText(content)}
        </div>
      );
    }

    // Handle numbered lists
    if (/^\d+\./.test(line)) {
      const number = line.split('.')[0] + '.';
      const content = line.split('.').slice(1).join('.');
      const indent = line.match(/^\s*/)[0].length;
      
      return (
        <div key={lineIndex} className={`mb-1 ${extraMarginClass}`} style={{ marginLeft: `${indent * 1.5}rem` }}>
          <span className="font-medium">{number}</span>
          {renderBoldText(content)}
        </div>
      );
    }

    // Handle custom large italic (line contains __ pattern)
    if (line.includes('__')) {
      const underscorePattern = /^(.*)__(.+?)__(.*)$/;
      const match = line.match(underscorePattern);
      if (match) {
        const [, prefix, content, suffix] = match;
        return (
          <div key={lineIndex} className={`mb-2 ${extraMarginClass}`}>
            <span style={{ fontSize: '1.25rem', fontStyle: 'italic', display: 'block' }}>
              {prefix}{content}{suffix}
            </span>
          </div>
        );
      }
    }

    // Handle context (line contains _ pattern)
    if (line.includes('_')) {
      const contextPattern = /^(.*)_(.+?)_(.*)$/;
      const match = line.match(contextPattern);
      if (match) {
      const [, prefix, content, suffix] = match;
      return (
        <div key={lineIndex} className={`mb-1 ${extraMarginClass}`}>
          <span className="text-gray-700 dark:text-gray-300 font-bold">
        {prefix}
        <span className="font-extrabold">{content}</span>
        {suffix}
          </span>
        </div>
      );
      }
    }

    // Handle headers (surrounded by **)
    if (line.startsWith('**') && line.endsWith('**')) {
      return (
        <div key={lineIndex} className={`mb-1 ${extraMarginClass}`}>
          <span className={`text-lg font-medium ${headingColor}`}>
            {line.slice(2, -2)}
          </span>
        </div>
      );
    }

    // Handle bold text (surrounded by **)
    if (line.includes('**')) {
      return (
        <div key={lineIndex} className={`mb-1 ${extraMarginClass}`}>
          {renderBoldText(line)}
        </div>
      );
    }

    // Regular text
    return (
      <div key={lineIndex} className={`mb-1 ${textColor} ${extraMarginClass}`}>
        {line}
      </div>
    );
  };

  const renderBoldText = (text) => {
    return text.split('**').map((part, partIndex) => {
      if (partIndex % 2 === 1) { // Odd indices are the bold parts
        return <span key={partIndex} className={`font-medium ${textColor}`}>{part}</span>;
      }
      return <span key={partIndex} className={textColor}>{part}</span>;
    });
  };

  const renderSection = (section, sectionIndex) => {
    const lines = section.split('\n');
    return (
      <div key={sectionIndex} className="mb-1">
        {lines.map((line, lineIndex) => {
          // Check if this is the very first line of the entire content
          const isFirstLine = sectionIndex === 0 && lineIndex === 0;
          return renderLine(line, lineIndex, isFirstLine);
        })}
      </div>
    );
  };

  const sections = processedText.split('\n\n');
  const content = sections.map((section, index) => renderSection(section, index));

  return <div className="prose max-w-none">{content}</div>;
};

export default renderMarkdown; 