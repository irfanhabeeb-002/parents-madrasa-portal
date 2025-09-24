import React from 'react';
import { Card } from '../ui/Card';
import questionsData from '../../data/questions.json';
import { SUBJECT_INFO } from '../../data/questionsData';

interface SubjectSelectorProps {
  onSubjectSelect: (subject: string, questionCount: number) => void;
  onClose: () => void;
}

interface SubjectInfo {
  name: string;
  malayalamName: string;
  description: string;
  malayalamDescription: string;
  questionCount: number;
  icon: string;
  difficulty: string;
}

export const SubjectSelector: React.FC<SubjectSelectorProps> = ({
  onSubjectSelect,
  onClose,
}) => {
  // Get unique subjects and their question counts
  const subjectCounts = questionsData.questions.reduce(
    (acc, question) => {
      acc[question.subject] = (acc[question.subject] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const subjects: SubjectInfo[] = Object.keys(SUBJECT_INFO).map(
    subjectName => ({
      name: subjectName,
      malayalamName: SUBJECT_INFO[subjectName].malayalamName,
      description: SUBJECT_INFO[subjectName].description,
      malayalamDescription: SUBJECT_INFO[subjectName].malayalamDescription,
      questionCount: subjectCounts[subjectName] || 0,
      icon: SUBJECT_INFO[subjectName].icon,
      difficulty: SUBJECT_INFO[subjectName].difficulty,
    })
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'hard':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const totalQuestions = Object.values(subjectCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Choose Your Subject
        </h2>
        <p className="text-gray-600" lang="ml">
          നിങ്ങളുടെ വിഷയം തിരഞ്ഞെടുക്കുക
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Select a subject to start practicing. Each test contains 5 random
          questions.
        </p>
      </div>

      {/* Mixed Questions Option */}
      <Card
        title="Mixed Questions"
        subtitle="Questions from all subjects combined"
        malayalamSubtitle="എല്ലാ വിഷയങ്ങളിൽ നിന്നുമുള്ള ചോദ്യങ്ങൾ"
        onClick={() => onSubjectSelect('', Math.min(5, totalQuestions))}
        variant="interactive"
        ariaLabel="Start mixed questions exercise"
        icon={<span className="text-2xl">🎯</span>}
        className="border-2 border-primary-200 bg-primary-50"
      >
        <div className="flex justify-between items-center text-sm mt-2">
          <span className="text-primary-700 font-medium">All Subjects</span>
          <span className="text-primary-600">
            {totalQuestions} questions available
          </span>
        </div>
      </Card>

      {/* Subject Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subjects.map(subject => (
          <Card
            key={subject.name}
            title={subject.name}
            subtitle={subject.description}
            malayalamSubtitle={subject.malayalamDescription}
            onClick={() =>
              subject.questionCount > 0 &&
              onSubjectSelect(subject.name, Math.min(5, subject.questionCount))
            }
            variant="interactive"
            disabled={subject.questionCount === 0}
            ariaLabel={`Start ${subject.name} exercise`}
            icon={<span className="text-2xl">{subject.icon}</span>}
          >
            <div className="flex justify-between items-center text-sm mt-2">
              <span
                className={`font-medium ${getDifficultyColor(subject.difficulty)}`}
              >
                {subject.difficulty}
              </span>
              <span className="text-gray-600">
                {subject.questionCount} question
                {subject.questionCount !== 1 ? 's' : ''}
              </span>
            </div>
            {subject.questionCount === 0 && (
              <div className="text-xs text-gray-500 mt-1">Coming soon...</div>
            )}
          </Card>
        ))}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">
          How it works:
          <span
            className="block text-sm font-normal text-blue-700 mt-1"
            lang="ml"
          >
            ഇത് എങ്ങനെ പ്രവർത്തിക്കുന്നു:
          </span>
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Each question has a 10-second timer</li>
          <li>• Questions and options are randomly shuffled</li>
          <li>• Your progress is saved automatically</li>
          <li>• Get instant feedback and explanations</li>
          <li>• See your final score and percentage</li>
        </ul>
        <ul className="text-xs text-blue-700 space-y-1 mt-2" lang="ml">
          <li>• ഓരോ ചോദ്യത്തിനും 10 സെക്കൻഡ് സമയം</li>
          <li>• ചോദ്യങ്ങളും ഓപ്ഷനുകളും ക്രമരഹിതമായി മാറ്റപ്പെടുന്നു</li>
          <li>• നിങ്ങളുടെ പുരോഗതി സ്വയമേവ സേവ് ചെയ്യപ്പെടുന്നു</li>
          <li>• തൽക്ഷണ ഫീഡ്ബാക്കും വിശദീകരണങ്ങളും ലഭിക്കുന്നു</li>
        </ul>
      </div>

      {/* Close Button */}
      <div className="text-center">
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-sm underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
