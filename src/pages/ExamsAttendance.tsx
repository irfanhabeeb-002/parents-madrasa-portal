import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout';
import {
    AccessibleButton,
    AlertBanner,
    ProgressIndicator,
    CalendarView,
    ExamTimer,
    SkeletonLoader,
    Card
} from '../components/ui';
import { ExerciseService } from '../services/exerciseService';
import { AttendanceService } from '../services/attendanceService';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils/dateUtils';
import type { Exercise, ExamResult, ExamAttempt, Question } from '../types/exercise';
import type { AttendanceStats, AttendanceRecord } from '../types/attendance';

type ViewMode = 'overview' | 'exams' | 'attendance' | 'exam-taking';

interface ExamFormData {
    answers: Record<string, string | string[]>;
    currentQuestionIndex: number;
}

export const ExamsAttendance: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<ViewMode>('overview');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Exam state
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [userResults, setUserResults] = useState<ExamResult[]>([]);
    const [currentExam, setCurrentExam] = useState<Exercise | null>(null);
    const [currentAttempt, setCurrentAttempt] = useState<ExamAttempt | null>(null);
    const [examFormData, setExamFormData] = useState<ExamFormData>({ answers: {}, currentQuestionIndex: 0 });

    // Attendance state
    const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
    const [attendanceRecord, setAttendanceRecord] = useState<AttendanceRecord | null>(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            // Load exercises and user results
            const [exercisesResponse, resultsResponse, statsResponse] = await Promise.all([
                ExerciseService.getExercises({ limit: 20 }),
                ExerciseService.getUserResults(user.uid),
                AttendanceService.getUserAttendanceStats(user.uid)
            ]);

            if (exercisesResponse.success) {
                setExercises(exercisesResponse.data);
            }

            if (resultsResponse.success) {
                setUserResults(resultsResponse.data);
            }

            if (statsResponse.success) {
                setAttendanceStats(statsResponse.data);
            }

            // Load attendance record for current month
            await loadAttendanceRecord(selectedMonth, selectedYear);

        } catch (err) {
            setError('Failed to load data');
            console.error('Error loading data:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadAttendanceRecord = async (month: number, year: number) => {
        if (!user) return;

        try {
            const recordResponse = await AttendanceService.getMonthlyAttendanceRecord(user.uid, month, year);
            if (recordResponse.success) {
                setAttendanceRecord(recordResponse.data);
            }
        } catch (err) {
            console.error('Error loading attendance record:', err);
        }
    };

    const handleStartExam = async (exercise: Exercise) => {
        if (!user) return;

        try {
            setLoading(true);
            const attemptResponse = await ExerciseService.startExamAttempt(exercise.id, user.uid);

            if (attemptResponse.success) {
                setCurrentExam(exercise);
                setCurrentAttempt(attemptResponse.data);
                setExamFormData({ answers: {}, currentQuestionIndex: 0 });
                setViewMode('exam-taking');
                setAlert({
                    type: 'success',
                    message: 'Exam started successfully'
                });
            } else {
                setAlert({
                    type: 'error',
                    message: attemptResponse.error || 'Failed to start exam'
                });
            }
        } catch (err) {
            setAlert({
                type: 'error',
                message: 'Failed to start exam'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (questionId: string, answer: string | string[]) => {
        setExamFormData(prev => ({
            ...prev,
            answers: {
                ...prev.answers,
                [questionId]: answer
            }
        }));

        // Update attempt in real-time
        if (currentAttempt) {
            ExerciseService.updateExamAttempt(currentAttempt.id, {
                answers: {
                    ...examFormData.answers,
                    [questionId]: answer
                }
            });
        }
    };

    const handleNextQuestion = () => {
        if (!currentExam) return;

        const nextIndex = examFormData.currentQuestionIndex + 1;
        if (nextIndex < currentExam.questions.length) {
            setExamFormData(prev => ({
                ...prev,
                currentQuestionIndex: nextIndex
            }));
        }
    };

    const handlePrevQuestion = () => {
        const prevIndex = examFormData.currentQuestionIndex - 1;
        if (prevIndex >= 0) {
            setExamFormData(prev => ({
                ...prev,
                currentQuestionIndex: prevIndex
            }));
        }
    };

    const handleSubmitExam = async () => {
        if (!currentAttempt) return;

        try {
            setLoading(true);
            const resultResponse = await ExerciseService.submitExam(currentAttempt.id);

            if (resultResponse.success) {
                setAlert({
                    type: 'success',
                    message: `Exam submitted! Score: ${resultResponse.data.score}%`
                });

                // Refresh user results
                const updatedResults = await ExerciseService.getUserResults(user!.uid);
                if (updatedResults.success) {
                    setUserResults(updatedResults.data);
                }

                // Return to exams view
                setViewMode('exams');
                setCurrentExam(null);
                setCurrentAttempt(null);
            } else {
                setAlert({
                    type: 'error',
                    message: resultResponse.error || 'Failed to submit exam'
                });
            }
        } catch (err) {
            setAlert({
                type: 'error',
                message: 'Failed to submit exam'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleTimeUp = () => {
        setAlert({
            type: 'error',
            message: 'Time is up! Submitting exam automatically.'
        });
        handleSubmitExam();
    };

    const handleMonthChange = (month: number, year: number) => {
        setSelectedMonth(month);
        setSelectedYear(year);
        loadAttendanceRecord(month, year);
    };

    const handleBack = () => {
        // Handle navigation back to overview from different view modes
        if (viewMode === 'exam-taking') {
            // When taking an exam, go back to exams list
            setViewMode('exams');
            setCurrentExam(null);
            setCurrentAttempt(null);
            setExamFormData({ answers: {}, currentQuestionIndex: 0 });
        } else if (viewMode === 'exams' || viewMode === 'attendance') {
            // From exams or attendance view, go back to overview
            setViewMode('overview');
        } else {
            // From overview mode, go back to dashboard
            navigate('/');
        }
    };

    const getUserExamResult = (exerciseId: string): ExamResult | undefined => {
        return userResults.find(result => result.exerciseId === exerciseId);
    };

    const canTakeExam = (exercise: Exercise): boolean => {
        const userAttempts = userResults.filter(result => result.exerciseId === exercise.id);
        return userAttempts.length < exercise.maxAttempts;
    };

    const renderOverview = () => (
        <div className="space-y-6">
            {/* Quick stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card
                    title="Available Exams"
                    subtitle={`${exercises.length} exams available`}
                    onClick={() => setViewMode('exams')}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    icon={
                        <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    }
                />

                <Card
                    title="Attendance Tracking"
                    subtitle={attendanceStats ? `${attendanceStats.attendancePercentage}% attendance` : 'Loading...'}
                    onClick={() => setViewMode('attendance')}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    icon={
                        <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    }
                />
            </div>

            {/* Recent exam results */}
            {userResults.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Recent Exam Results
                    </h3>

                    <div className="space-y-3">
                        {userResults.slice(0, 3).map(result => {
                            const exercise = exercises.find(e => e.id === result.exerciseId);
                            return (
                                <div key={result.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-900">{exercise?.title || 'Unknown Exam'}</p>
                                        <p className="text-sm text-gray-600">
                                            Completed: {formatDate(result.completedAt)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold ${result.score >= (exercise?.passingScore || 70) ? 'text-success-600' : 'text-error-600'}`}>
                                            {result.score}%
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {result.score >= (exercise?.passingScore || 70) ? 'Passed' : 'Failed'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );

    const renderExamsList = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <AccessibleButton
                        variant="secondary"
                        size="sm"
                        onClick={() => setViewMode('overview')}
                        ariaLabel="Back to overview"
                        className="!min-h-[36px] !min-w-[36px] !p-2"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                    </AccessibleButton>
                    <h2 className="text-xl font-semibold text-gray-900">
                        Available Exams
                    </h2>
                </div>
            </div>

            {exercises.map(exercise => {
                const userResult = getUserExamResult(exercise.id);
                const canTake = canTakeExam(exercise);
                const attemptsUsed = userResults.filter(r => r.exerciseId === exercise.id).length;

                return (
                    <div key={exercise.id} className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">{exercise.title}</h3>
                                <p className="text-gray-600 mb-4">{exercise.description}</p>

                                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                                    <div>
                                        <span className="font-medium">Time Limit:</span> {exercise.timeLimit} minutes
                                    </div>
                                    <div>
                                        <span className="font-medium">Passing Score:</span> {exercise.passingScore}%
                                    </div>
                                    <div>
                                        <span className="font-medium">Questions:</span> {exercise.questions.length}
                                    </div>
                                    <div>
                                        <span className="font-medium">Attempts:</span> {attemptsUsed}/{exercise.maxAttempts}
                                    </div>
                                </div>

                                {userResult && (
                                    <div className={`p-3 rounded-lg ${userResult.score >= exercise.passingScore ? 'bg-success-50 border border-success-200' : 'bg-error-50 border border-error-200'}`}>
                                        <p className="font-medium">
                                            Last Score: {userResult.score}%
                                            <span className="ml-2">
                                                {userResult.score >= exercise.passingScore ? '✅ Passed' : '❌ Failed'}
                                            </span>
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Completed: {formatDate(userResult.completedAt)}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="ml-4">
                                <AccessibleButton
                                    variant={canTake ? 'primary' : 'secondary'}
                                    onClick={() => canTake && handleStartExam(exercise)}
                                    disabled={!canTake}
                                    ariaLabel={canTake ? `Start ${exercise.title}` : 'Maximum attempts reached'}
                                >
                                    {canTake ? 'Start Exam' : 'Max Attempts'}
                                </AccessibleButton>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );

    const renderExamTaking = () => {
        if (!currentExam || !currentAttempt) return null;

        const currentQuestion = currentExam.questions[examFormData.currentQuestionIndex];
        const isLastQuestion = examFormData.currentQuestionIndex === currentExam.questions.length - 1;
        const userAnswer = examFormData.answers[currentQuestion.id];

        return (
            <div className="max-w-4xl mx-auto">
                {/* Back to exams button */}
                <div className="mb-4">
                    <AccessibleButton
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                            if (window.confirm('Are you sure you want to exit this exam? Your progress will be lost.')) {
                                setViewMode('exams');
                                setCurrentExam(null);
                                setCurrentAttempt(null);
                                setExamFormData({ answers: {}, currentQuestionIndex: 0 });
                            }
                        }}
                        ariaLabel="Exit exam and return to exams list"
                        className="flex items-center space-x-2"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                        <span>Exit Exam</span>
                    </AccessibleButton>
                </div>

                {/* Timer */}
                {currentExam.timeLimit && (
                    <div className="mb-6 text-center">
                        <ExamTimer
                            timeLimit={currentExam.timeLimit * 60} // Convert minutes to seconds
                            onTimeUp={handleTimeUp}
                            className="inline-block"
                        />
                    </div>
                )}

                {/* Progress */}
                <div className="mb-8">
                    <ProgressIndicator
                        currentStep={examFormData.currentQuestionIndex + 1}
                        totalSteps={currentExam.questions.length}
                        ariaLabel="Exam progress"
                    />
                </div>

                {/* Question */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Question {examFormData.currentQuestionIndex + 1}
                        </h3>
                        <p className="text-gray-800 mb-2">{currentQuestion.question}</p>
                        {currentQuestion.questionMalayalam && (
                            <p className="text-gray-600 text-sm" lang="ml">{currentQuestion.questionMalayalam}</p>
                        )}
                    </div>

                    {/* Answer options */}
                    <div className="space-y-3">
                        {currentQuestion.type === 'mcq' && currentQuestion.options?.map(option => (
                            <label key={option.id} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                <input
                                    type="radio"
                                    name={`question-${currentQuestion.id}`}
                                    value={option.id}
                                    checked={userAnswer === option.id}
                                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                                    className="mr-3 h-4 w-4 text-primary-600"
                                />
                                <div>
                                    <span className="text-gray-900">{option.text}</span>
                                    {option.textMalayalam && (
                                        <span className="text-gray-600 text-sm ml-2" lang="ml">({option.textMalayalam})</span>
                                    )}
                                </div>
                            </label>
                        ))}

                        {currentQuestion.type === 'text' && (
                            <textarea
                                value={Array.isArray(userAnswer) ? userAnswer[0] || '' : userAnswer || ''}
                                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                                placeholder="Enter your answer here..."
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                rows={4}
                            />
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center">
                    <AccessibleButton
                        variant="secondary"
                        onClick={handlePrevQuestion}
                        disabled={examFormData.currentQuestionIndex === 0}
                        ariaLabel="Previous question"
                    >
                        ← Previous
                    </AccessibleButton>

                    <span className="text-sm text-gray-600">
                        Question {examFormData.currentQuestionIndex + 1} of {currentExam.questions.length}
                    </span>

                    {isLastQuestion ? (
                        <AccessibleButton
                            variant="success"
                            onClick={handleSubmitExam}
                            ariaLabel="Submit exam"
                        >
                            Submit Exam
                        </AccessibleButton>
                    ) : (
                        <AccessibleButton
                            variant="primary"
                            onClick={handleNextQuestion}
                            ariaLabel="Next question"
                        >
                            Next →
                        </AccessibleButton>
                    )}
                </div>
            </div>
        );
    };

    const renderAttendance = () => {
        const attendanceData: Record<string, { status: any; duration?: number; notes?: string }> = {};

        if (attendanceRecord) {
            attendanceRecord.attendanceDetails.forEach(detail => {
                attendanceData[detail.date] = {
                    status: detail.status,
                    duration: detail.duration,
                    notes: detail.notes
                };
            });
        }

        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <AccessibleButton
                            variant="secondary"
                            size="sm"
                            onClick={() => setViewMode('overview')}
                            ariaLabel="Back to overview"
                            className="!min-h-[36px] !min-w-[36px] !p-2"
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                        </AccessibleButton>
                        <h2 className="text-xl font-semibold text-gray-900">
                            Attendance Tracking
                        </h2>
                    </div>
                </div>

                {/* Attendance stats */}
                {attendanceStats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg shadow-md p-4 text-center">
                            <div className="text-2xl font-bold text-primary-600">{attendanceStats.totalClasses}</div>
                            <div className="text-sm text-gray-600">Total Classes</div>
                        </div>

                        <div className="bg-white rounded-lg shadow-md p-4 text-center">
                            <div className="text-2xl font-bold text-success-600">{attendanceStats.attendedClasses}</div>
                            <div className="text-sm text-gray-600">Attended</div>
                        </div>

                        <div className="bg-white rounded-lg shadow-md p-4 text-center">
                            <div className="text-2xl font-bold text-primary-600">{attendanceStats.attendancePercentage}%</div>
                            <div className="text-sm text-gray-600">Attendance Rate</div>
                        </div>

                        <div className="bg-white rounded-lg shadow-md p-4 text-center">
                            <div className="text-2xl font-bold text-warning-600">{attendanceStats.longestStreak}</div>
                            <div className="text-sm text-gray-600">Longest Streak</div>
                        </div>
                    </div>
                )}

                {/* Calendar view */}
                <CalendarView
                    month={selectedMonth}
                    year={selectedYear}
                    attendanceData={attendanceData}
                    onMonthChange={handleMonthChange}
                />
            </div>
        );
    };

    if (loading) {
        return (
            <Layout
                showBackButton={true}
                title="Exams & Attendance"
                onBack={handleBack}
            >
                <div className="space-y-4">
                    <SkeletonLoader className="h-32" />
                    <SkeletonLoader className="h-48" />
                    <SkeletonLoader className="h-24" />
                </div>
            </Layout>
        );
    }

    return (
        <Layout
            showBackButton={true}
            title="Exams & Attendance"
            onBack={handleBack}
        >
            {alert && (
                <div className="mb-4">
                    <AlertBanner
                        type={alert.type}
                        message={alert.message}
                        malayalamMessage={alert.malayalamMessage}
                        onDismiss={() => setAlert(null)}
                        autoHide={true}
                        duration={5000}
                    />
                </div>
            )}

            {error && (
                <div className="mb-4">
                    <AlertBanner
                        type="error"
                        message={error}
                        onDismiss={() => setError(null)}
                    />
                </div>
            )}

            {viewMode === 'overview' && renderOverview()}
            {viewMode === 'exams' && renderExamsList()}
            {viewMode === 'exam-taking' && renderExamTaking()}
            {viewMode === 'attendance' && renderAttendance()}
        </Layout>
    );
};