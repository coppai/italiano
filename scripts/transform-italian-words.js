#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const inputPath = process.argv[2] || path.join(__dirname, '../public/italian-words.json');
const outputPath = process.argv[3] || inputPath;

console.log(`Reading from: ${inputPath}`);

const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

const transformed = data.map(word => {
  // Extract Italian word from question: "What does 'il' mean in English?"
  const italianMatch = word.question.match(/What does '(.+?)' mean in English\?/);
  const italian = italianMatch ? italianMatch[1] : '';
  
  // The current answer is the English translation
  const english = word.answer;
  
  // Swap them: question = English, answer = Italian
  return {
    ...word,
    question: english,
    answer: italian,
    notes: word.notes || ''
  };
});

fs.writeFileSync(outputPath, JSON.stringify(transformed, null, 2), 'utf8');
console.log(`✅ Transformed ${transformed.length} words`);
console.log(`Written to: ${outputPath}`);
