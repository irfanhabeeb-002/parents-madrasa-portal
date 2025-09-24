# Questions Database

This directory contains the questions database for the Practice Exercises system.

## File Structure

- `questions.json` - Main questions database
- `questionsData.ts` - TypeScript interface definitions (if needed)

## Adding New Questions

To add new questions to the system, edit the `questions.json` file following the structure below:

### Question Structure

```json
{
  "id": "unique_question_id",
  "subject": "Subject Name",
  "question": "Question text in English",
  "questionMalayalam": "Question text in Malayalam (optional)",
  "options": [
    {
      "id": "a",
      "text": "Option A text",
      "textMalayalam": "Option A in Malayalam (optional)"
    },
    {
      "id": "b",
      "text": "Option B text",
      "textMalayalam": "Option B in Malayalam (optional)"
    },
    {
      "id": "c",
      "text": "Option C text",
      "textMalayalam": "Option C in Malayalam (optional)"
    },
    {
      "id": "d",
      "text": "Option D text",
      "textMalayalam": "Option D in Malayalam (optional)"
    }
  ],
  "answer": "a",
  "explanation": "Explanation of the correct answer (optional)",
  "explanationMalayalam": "Explanation in Malayalam (optional)",
  "difficulty": "easy|medium|hard",
  "points": 10
}
```

### Supported Subjects

The system currently supports these subjects:

1. **Kithabu Thawheed** - Islamic monotheism and theology
2. **Swiffathul Swalathu Nabi** - Description of Prophet's prayer method
3. **Tajweed** - Quranic recitation rules and pronunciation
4. **Hifz** - Quran memorization techniques and verses
5. **Tafseer** - Quranic interpretation and understanding

### Field Descriptions

- **id**: Unique identifier for the question (use subject prefix + number, e.g., "kt_001")
- **subject**: Must match one of the supported subjects exactly
- **question**: The main question text in English
- **questionMalayalam**: Optional Malayalam translation of the question
- **options**: Array of 4 answer options (a, b, c, d)
- **answer**: The correct option ID ("a", "b", "c", or "d")
- **explanation**: Optional explanation of why the answer is correct
- **explanationMalayalam**: Optional Malayalam translation of the explanation
- **difficulty**: Question difficulty level ("easy", "medium", or "hard")
- **points**: Points awarded for correct answer (typically 10 for easy, 15 for medium, 20 for hard)

### ID Naming Convention

Use the following prefixes for question IDs:

- `kt_` - Kithabu Thawheed
- `ss_` - Swiffathul Swalathu Nabi
- `tj_` - Tajweed
- `hf_` - Hifz
- `tf_` - Tafseer

Example: `kt_001`, `ss_002`, `tj_003`

### Adding Questions Steps

1. Open `questions.json` in a text editor
2. Add your new question object to the `questions` array
3. Ensure the JSON syntax is valid (use a JSON validator if needed)
4. Test the question by running the application
5. Verify the question appears in the correct subject category

### Example Addition

```json
{
  "questions": [
    // ... existing questions ...
    {
      "id": "kt_003",
      "subject": "Kithabu Thawheed",
      "question": "What is the opposite of Tawheed?",
      "questionMalayalam": "തൗഹീദിന്റെ വിപരീതം എന്താണ്?",
      "options": [
        {
          "id": "a",
          "text": "Shirk",
          "textMalayalam": "ശിർക്ക്"
        },
        {
          "id": "b",
          "text": "Kufr",
          "textMalayalam": "കുഫ്ർ"
        },
        {
          "id": "c",
          "text": "Nifaq",
          "textMalayalam": "നിഫാഖ്"
        },
        {
          "id": "d",
          "text": "Fisq",
          "textMalayalam": "ഫിസ്ഖ്"
        }
      ],
      "answer": "a",
      "explanation": "Shirk (associating partners with Allah) is the direct opposite of Tawheed (monotheism).",
      "explanationMalayalam": "ശിർക്ക് (അല്ലാഹുവിന് പങ്കാളികളെ കൂട്ടുക) തൗഹീദിന്റെ (ഏകദൈവവിശ്വാസം) നേർ വിപരീതമാണ്.",
      "difficulty": "easy",
      "points": 10
    }
  ]
}
```

### Best Practices

1. **Unique IDs**: Always ensure question IDs are unique across all subjects
2. **Balanced Options**: Make sure incorrect options are plausible but clearly wrong
3. **Clear Language**: Use simple, clear language appropriate for the target audience
4. **Malayalam Support**: Include Malayalam translations when possible for better accessibility
5. **Appropriate Difficulty**: Match the difficulty level with the complexity of the question
6. **Explanations**: Provide helpful explanations to aid learning
7. **Validation**: Always validate your JSON syntax before saving

### Testing New Questions

After adding questions:

1. Start the application
2. Navigate to Notes & Exercises
3. Click "Start Practice Exercise"
4. Select the subject you added questions to
5. Verify your questions appear and function correctly
6. Check that Malayalam text displays properly
7. Ensure explanations show after answering

### Troubleshooting

**Question not appearing:**

- Check that the subject name matches exactly
- Verify JSON syntax is valid
- Ensure the question ID is unique

**Malayalam text not displaying:**

- Check that the text is properly encoded in UTF-8
- Verify the `lang="ml"` attribute is applied in the component

**Application crashes:**

- Validate JSON syntax using an online JSON validator
- Check for missing required fields
- Ensure all option IDs are unique within each question

For technical support or questions about the question format, please refer to the development team.
