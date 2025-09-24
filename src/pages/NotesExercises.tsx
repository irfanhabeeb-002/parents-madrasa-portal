import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { AccessibleButton } from '../components/ui/AccessibleButton';
import { AlertBanner } from '../components/ui/AlertBanner';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import { NoteService } from '../services/noteService';
import { ExerciseService } from '../services/exerciseService';
import { useAuth } from '../contexts/AuthContext';
import type { Note } from '../types/note';
import type { Exercise } from '../types/exercise';
import { PDFViewer } from '../components/notes/PDFViewer';
import { EnhancedExerciseComponent } from '../components/exercises/EnhancedExerciseComponent';
import { SubjectSelector } from '../components/exercises/SubjectSelector';

interface NotesExercisesState {
  notes: Note[];
  exercises: Exercise[];
  loading: boolean;
  error: string | null;
  selectedNote: Note | null;
  showPDFViewer: boolean;
  showSubjectSelector: boolean;
  showExercise: boolean;
  selectedSubject: string;
  questionCount: number;
  searchQuery: string;
  filterSubject: string;
  filterDifficulty: string;
}

export const NotesExercises: React.FC = () => {
  const { user } = useAuth();
  const [state, setState] = useState<NotesExercisesState>({
    notes: [],
    exercises: [],
    loading: true,
    error: null,
    selectedNote: null,
    showPDFViewer: false,
    showSubjectSelector: false,
    showExercise: false,
    selectedSubject: '',
    questionCount: 5,
    searchQuery: '',
    filterSubject: '',
    filterDifficulty: '',
  });

  // Load notes and exercises on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const [notesResponse, exercisesResponse] = await Promise.all([
        NoteService.getNotes({ limit: 50 }),
        ExerciseService.getExercises({ limit: 50 }),
      ]);

      if (notesResponse.success && exercisesResponse.success) {
        setState(prev => ({
          ...prev,
          notes: notesResponse.data,
          exercises: exercisesResponse.data,
          loading: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          error:
            notesResponse.error ||
            exercisesResponse.error ||
            'Failed to load data',
          loading: false,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load data',
        loading: false,
      }));
    }
  };

  const handleNoteClick = async (note: Note) => {
    setState(prev => ({ ...prev, selectedNote: note }));

    // Track note view
    if (user) {
      await NoteService.trackView(note.id, user.uid, 0);
    }

    if (note.pdfUrl) {
      setState(prev => ({ ...prev, showPDFViewer: true }));
    }
  };

  const handleStartExercise = () => {
    setState(prev => ({
      ...prev,
      showSubjectSelector: true,
    }));
  };

  const handleSubjectSelect = (subject: string, questionCount: number) => {
    setState(prev => ({
      ...prev,
      selectedSubject: subject,
      questionCount,
      showSubjectSelector: false,
      showExercise: true,
    }));
  };

  const handleExerciseComplete = (result: any) => {
    console.warn('Exercise completed with result:', result);
    setState(prev => ({
      ...prev,
      showExercise: false,
      selectedSubject: '',
      questionCount: 5,
    }));
  };

  const closePDFViewer = () => {
    setState(prev => ({
      ...prev,
      showPDFViewer: false,
      selectedNote: null,
    }));
  };

  const closeExercise = () => {
    setState(prev => ({
      ...prev,
      showExercise: false,
      showSubjectSelector: false,
      selectedSubject: '',
      questionCount: 5,
    }));
  };

  // Filter and search functionality
  const filteredNotes = state.notes.filter(note => {
    const matchesSearch =
      !state.searchQuery ||
      note.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      note.tags.some(tag =>
        tag.toLowerCase().includes(state.searchQuery.toLowerCase())
      );

    const matchesSubject =
      !state.filterSubject || note.subject === state.filterSubject;
    const matchesDifficulty =
      !state.filterDifficulty || note.difficulty === state.filterDifficulty;

    return matchesSearch && matchesSubject && matchesDifficulty;
  });

  const filteredExercises = state.exercises.filter(exercise => {
    const matchesSearch =
      !state.searchQuery ||
      exercise.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      exercise.description
        .toLowerCase()
        .includes(state.searchQuery.toLowerCase()) ||
      exercise.tags.some(tag =>
        tag.toLowerCase().includes(state.searchQuery.toLowerCase())
      );

    const matchesDifficulty =
      !state.filterDifficulty || exercise.difficulty === state.filterDifficulty;

    return matchesSearch && matchesDifficulty;
  });

  // Get unique subjects for filter
  const subjects = Array.from(new Set(state.notes.map(note => note.subject)));
  const difficulties = ['beginner', 'intermediate', 'advanced'];

  if (state.loading && state.notes.length === 0) {
    return (
      <Layout showBackButton={true} title="Notes & Exercises">
        <div className="space-y-6">
          <SkeletonLoader variant="text" lines={2} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="bg-white rounded-lg border border-gray-200 p-4"
              >
                <SkeletonLoader variant="text" className="mb-2" />
                <SkeletonLoader variant="text" lines={3} />
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBackButton={true} title="Notes & Exercises">
      <div className="space-y-6">
        {state.error && (
          <AlertBanner
            type="error"
            message={state.error}
            onDismiss={() => setState(prev => ({ ...prev, error: null }))}
            autoHide={true}
          />
        )}

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="space-y-4">
            {/* Search Input */}
            <div>
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Search Notes & Exercises
              </label>
              <input
                id="search"
                type="text"
                value={state.searchQuery}
                onChange={e =>
                  setState(prev => ({ ...prev, searchQuery: e.target.value }))
                }
                placeholder="Search by title, content, or tags..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                aria-label="Search notes and exercises"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="subject-filter"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Subject
                </label>
                <select
                  id="subject-filter"
                  value={state.filterSubject}
                  onChange={e =>
                    setState(prev => ({
                      ...prev,
                      filterSubject: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Subjects</option>
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="difficulty-filter"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Difficulty
                </label>
                <select
                  id="difficulty-filter"
                  value={state.filterDifficulty}
                  onChange={e =>
                    setState(prev => ({
                      ...prev,
                      filterDifficulty: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Levels</option>
                  {difficulties.map(difficulty => (
                    <option key={difficulty} value={difficulty}>
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Lesson Notes
          </h2>

          {filteredNotes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No notes found matching your criteria
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredNotes.map(note => (
                <Card
                  key={note.id}
                  title={note.title}
                  subtitle={note.summary || note.subject}
                  onClick={() => handleNoteClick(note)}
                  variant="interactive"
                  ariaLabel={`Open note: ${note.title}`}
                  icon={
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  }
                >
                  <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                    <span>{note.difficulty}</span>
                    <span>{note.viewCount} views</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Practice Exercises Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Practice Exercises
          </h2>

          <div className="text-center py-8">
            <div className="text-6xl mb-4">🧠</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Test Your Knowledge
            </h3>
            <p className="text-gray-600 mb-4">
              Practice with randomized questions from Islamic subjects
            </p>

            <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
              <h4 className="font-semibold text-blue-900 mb-2">Features:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 10-second timer per question</li>
                <li>• Randomized questions and options</li>
                <li>• Instant feedback and explanations</li>
                <li>• Progress tracking and scoring</li>
                <li>• Malayalam language support</li>
              </ul>
            </div>

            <AccessibleButton
              variant="primary"
              size="lg"
              onClick={handleStartExercise}
              ariaLabel="Start practice exercise"
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                border: '2px solid #2563eb',
              }}
            >
              Start Practice Exercise
            </AccessibleButton>
          </div>
        </div>

        {/* PDF Viewer Modal */}
        {state.showPDFViewer && state.selectedNote && (
          <Modal
            isOpen={state.showPDFViewer}
            onClose={closePDFViewer}
            title={state.selectedNote.title}
            size="2xl"
          >
            <PDFViewer note={state.selectedNote} onClose={closePDFViewer} />
          </Modal>
        )}

        {/* Subject Selector Modal */}
        {state.showSubjectSelector && (
          <Modal
            isOpen={state.showSubjectSelector}
            onClose={closeExercise}
            title="Practice Exercises"
            size="2xl"
          >
            <SubjectSelector
              onSubjectSelect={handleSubjectSelect}
              onClose={closeExercise}
            />
          </Modal>
        )}

        {/* Exercise Modal */}
        {state.showExercise && (
          <Modal
            isOpen={state.showExercise}
            onClose={closeExercise}
            title={`${state.selectedSubject || 'Mixed'} Exercise`}
            size="2xl"
            closeOnOverlayClick={false}
          >
            <EnhancedExerciseComponent
              subject={state.selectedSubject}
              numberOfQuestions={state.questionCount}
              onComplete={handleExerciseComplete}
              onClose={closeExercise}
            />
          </Modal>
        )}
      </div>
    </Layout>
  );
};
