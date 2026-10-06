import { useState, useCallback, useEffect } from 'react';
import { quizData, Question } from './quizData';

type QuizState = 'start' | 'quiz' | 'result';

const STORAGE_KEY = 'topography_quiz_completed';
const STORAGE_SCORE_KEY = 'topography_quiz_score';
const STORAGE_ANSWERS_KEY = 'topography_quiz_answers';
const STORAGE_NAME_KEY = 'topography_quiz_name';

function App() {
  const [state, setState] = useState<QuizState>('start');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(
    new Array(quizData.length).fill(null)
  );
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [savedName, setSavedName] = useState('');
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (completed === 'true') {
      setIsCompleted(true);
      const savedScore = localStorage.getItem(STORAGE_SCORE_KEY);
      const savedAnswers = localStorage.getItem(STORAGE_ANSWERS_KEY);
      const savedStudentName = localStorage.getItem(STORAGE_NAME_KEY);
      if (savedScore) setScore(parseInt(savedScore));
      if (savedAnswers) setSelectedAnswers(JSON.parse(savedAnswers));
      if (savedStudentName) setSavedName(savedStudentName);
      setState('result');
    }
  }, []);

  const startQuiz = () => {
    const trimmedName = studentName.trim();
    if (!trimmedName) {
      setNameError('Аты-жөніңізді жазыңыз!');
      return;
    }
    if (trimmedName.length < 3) {
      setNameError('Аты-жөні кемінде 3 таңба болуы керек!');
      return;
    }
    setNameError('');
    setSavedName(trimmedName);
    localStorage.setItem(STORAGE_NAME_KEY, trimmedName);
    setState('quiz');
    setCurrentQuestion(0);
    setSelectedAnswers(new Array(quizData.length).fill(null));
    setShowExplanation(false);
    setScore(0);
  };

  const handleAnswerSelect = (optionIndex: number) => {
    if (showExplanation) return;
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = optionIndex;
    setSelectedAnswers(newAnswers);
    setShowExplanation(true);

    let newScore = score;
    if (optionIndex === quizData[currentQuestion].correctAnswer) {
      newScore = score + 1;
      setScore(newScore);
    }

    setTimeout(() => {
      if (currentQuestion < quizData.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setShowExplanation(false);
      } else {
        localStorage.setItem(STORAGE_KEY, 'true');
        localStorage.setItem(STORAGE_SCORE_KEY, newScore.toString());
        localStorage.setItem(STORAGE_ANSWERS_KEY, JSON.stringify(newAnswers));
        setIsCompleted(true);
        setState('result');
      }
    }, 1500);
  };

  const getGrade = useCallback(() => {
    const percentage = (score / quizData.length) * 100;
    if (percentage >= 90) return { grade: '5 (Өте жақсы)', color: 'text-green-600', emoji: '🏆' };
    if (percentage >= 75) return { grade: '4 (Жақсы)', color: 'text-blue-600', emoji: '👍' };
    if (percentage >= 60) return { grade: '3 (Қанағаттанарлық)', color: 'text-yellow-600', emoji: '📚' };
    return { grade: '2 (Қайталау қажет)', color: 'text-red-600', emoji: '📖' };
  }, [score]);

  const progressPercentage = ((currentQuestion + 1) / quizData.length) * 100;

  const getDateTime = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return now.toLocaleDateString('kk-KZ', options);
  };

  // Word файлға экспорттау
  const exportToWord = () => {
    const optionLabels = ['A', 'B', 'C', 'D'];
    
    let questionsHtml = '';
    quizData.forEach((q: Question, idx: number) => {
      questionsHtml += `
        <div style="margin-bottom: 20px; page-break-inside: avoid;">
          <p style="font-weight: bold; font-size: 14px; margin-bottom: 8px;">
            ${idx + 1}. ${q.question}
          </p>
          <table style="width: 100%; border-collapse: collapse;">
      `;
      q.options.forEach((opt: string, optIdx: number) => {
        const isCorrect = optIdx === q.correctAnswer;
        const userAnswered = selectedAnswers[idx] === optIdx;
        let bgColor = '#ffffff';
        let marker = '';
        
        if (userAnswered && isCorrect) {
          bgColor = '#d4edda';
          marker = ' ✅';
        } else if (userAnswered && !isCorrect) {
          bgColor = '#f8d7da';
          marker = ' ❌';
        } else if (isCorrect) {
          bgColor = '#d4edda';
          marker = ' ✓';
        }
        
        questionsHtml += `
          <tr>
            <td style="padding: 6px 12px; background-color: ${bgColor}; border: 1px solid #ddd;">
              <strong>${optionLabels[optIdx]})</strong> ${opt}${marker}
            </td>
          </tr>
        `;
      });
      questionsHtml += `
          </table>
          <p style="color: #2563eb; font-size: 12px; margin-top: 6px; font-style: italic;">
            💡 ${q.explanation}
          </p>
        </div>
      `;
    });

    const percentage = Math.round((score / quizData.length) * 100);
    const gradeInfo = getGrade();

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>Тест нәтижесі - ${savedName}</title>
          <style>
            body {
              font-family: 'Times New Roman', Times, serif;
              font-size: 14px;
              line-height: 1.6;
              color: #000;
              margin: 40px;
            }
            h1 {
              text-align: center;
              font-size: 22px;
              margin-bottom: 5px;
            }
            h2 {
              text-align: center;
              font-size: 16px;
              color: #555;
              font-weight: normal;
              margin-top: 0;
              margin-bottom: 30px;
            }
            .info-box {
              background-color: #f0f4ff;
              border: 1px solid #c3d4f7;
              padding: 15px;
              border-radius: 5px;
              margin-bottom: 20px;
            }
            .result-box {
              background-color: #f8f9fa;
              border: 2px solid #dee2e6;
              padding: 20px;
              border-radius: 5px;
              text-align: center;
              margin-bottom: 30px;
            }
            .score {
              font-size: 36px;
              font-weight: bold;
              color: #1e3a8a;
            }
            .grade {
              font-size: 20px;
              font-weight: bold;
              margin-top: 10px;
            }
            table {
              width: 100%;
              margin-bottom: 10px;
            }
            td {
              padding: 6px 12px;
              border: 1px solid #ddd;
            }
          </style>
        </head>
        <body>
          <h1>Үлкен масштабты түсірістер</h1>
          <h2>Топографиялық түсірістердің масштабы мен бедер биіктігін таңдау</h2>
          
          <div class="info-box">
            <p><strong>Оқушы:</strong> ${savedName}</p>
            <p><strong>Тест тапсырған уақыты:</strong> ${getDateTime()}</p>
            <p><strong>Сұрақтар саны:</strong> ${quizData.length}</p>
          </div>
          
          <div class="result-box">
            <p class="score">${score} / ${quizData.length}</p>
            <p style="font-size: 24px; color: #555;">${percentage}%</p>
            <p class="grade">Баға: ${gradeInfo.grade}</p>
            <p style="margin-top: 10px;">
              Дұрыс жауаптар: ${score} | Қате жауаптар: ${quizData.length - score}
            </p>
          </div>

          <h2 style="text-align: left; font-size: 18px; font-weight: bold; border-bottom: 2px solid #1e3a8a; padding-bottom: 5px;">
            Тест сұрақтары мен жауаптар
          </h2>

          ${questionsHtml}

          <div style="margin-top: 40px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #ddd; padding-top: 15px;">
            <p>Бұл құжат автоматты түрде жасалды</p>
            <p>© Топографиялық түсірістер - Интерактивті тест</p>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Тест_нәтижесі_${savedName.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Result screen
  if (isCompleted && state === 'result') {
    const gradeInfo = getGrade();
    const percentage = Math.round((score / quizData.length) * 100);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-3 sm:p-4">
        <div className="max-w-2xl w-full bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-12 shadow-2xl border border-white/20">
          <div className="text-center">
            <div className="text-5xl sm:text-6xl md:text-7xl mb-4 sm:mb-6">{gradeInfo.emoji}</div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
              Тест нәтижесі
            </h1>

            <div className="bg-white/10 rounded-lg sm:rounded-xl py-2 sm:py-3 px-4 sm:px-6 inline-block mb-3 sm:mb-4">
              <p className="text-white/60 text-xs sm:text-sm">Оқушы</p>
              <p className="text-white text-lg sm:text-xl font-bold break-words">{savedName}</p>
            </div>
            
            <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
              <p className="text-yellow-200 text-xs sm:text-sm">
                ⚠️ Бұл тестті тек 1 рет тапсыруға болады. Қайта тапсыру мүмкін емес.
              </p>
            </div>

            <div className="bg-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
              <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-2">
                {score}/{quizData.length}
              </div>
              <div className="text-xl sm:text-2xl text-blue-200 mb-3 sm:mb-4">
                {percentage}%
              </div>
              <div className={`text-lg sm:text-xl md:text-2xl font-bold ${gradeInfo.color} bg-white/10 rounded-lg sm:rounded-xl py-2 sm:py-3 px-4 sm:px-6 inline-block`}>
                Баға: {gradeInfo.grade}
              </div>
            </div>

            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="50%" cy="50%" r="45%" stroke="rgba(255,255,255,0.1)" strokeWidth="10%" fill="none" />
                  <circle
                    cx="50%" cy="50%" r="45%"
                    stroke={percentage >= 60 ? '#10b981' : '#ef4444'}
                    strokeWidth="10%" fill="none"
                    strokeDasharray={`${(percentage / 100) * 283} 283`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl sm:text-3xl font-bold text-white">{percentage}%</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
              <h3 className="text-white font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Сіздің жауаптарыңыз:</h3>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
                {quizData.map((q: Question, idx: number) => (
                  <div
                    key={q.id}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${
                      selectedAnswers[idx] === q.correctAnswer ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}
                  >
                    {idx + 1}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 sm:gap-4 justify-center mt-3 sm:mt-4 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-green-500"></div>
                  <span className="text-white/70">Дұрыс: {score}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-red-500"></div>
                  <span className="text-white/70">Қате: {quizData.length - score}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 text-left max-h-48 sm:max-h-56 md:max-h-60 overflow-y-auto">
              <h3 className="text-white font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Толық жауаптар:</h3>
              <div className="space-y-2 sm:space-y-3">
                {quizData.map((q: Question, idx: number) => (
                  <div key={q.id} className="border-b border-white/10 pb-2 sm:pb-3 last:border-0">
                    <p className="text-white/90 text-xs sm:text-sm font-medium mb-1">{idx + 1}. {q.question}</p>
                    <p className={`text-xs sm:text-sm ${selectedAnswers[idx] === q.correctAnswer ? 'text-green-300' : 'text-red-300'}`}>
                      Сіздің жауабыңыз: {q.options[selectedAnswers[idx]!]}
                    </p>
                    {selectedAnswers[idx] !== q.correctAnswer && (
                      <p className="text-green-300 text-xs sm:text-sm">Дұрыс жауап: {q.options[q.correctAnswer]}</p>
                    )}
                    <p className="text-blue-200 text-[10px] sm:text-xs mt-1">💡 {q.explanation}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Word жүктеу батырмасы */}
            <button
              onClick={exportToWord}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg sm:rounded-xl text-sm sm:text-base transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl mb-3 flex items-center justify-center gap-2"
            >
              <span className="text-xl sm:text-2xl">📄</span>
              <span>Word форматында жүктеу (.doc)</span>
            </button>

            <div className="bg-white/5 rounded-lg sm:rounded-xl p-3 sm:p-4">
              <p className="text-white/60 text-xs sm:text-sm">
                📅 Тест аяқталған уақыты: {getDateTime()}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Start screen
  if (state === 'start') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-3 sm:p-4">
        <div className="max-w-2xl w-full bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-12 shadow-2xl border border-white/20">
          <div className="text-center">
            <div className="text-5xl sm:text-6xl mb-4 sm:mb-6">🗺️</div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
              Үлкен масштабты түсірістер
            </h1>
            <h2 className="text-base sm:text-xl md:text-2xl text-blue-200 mb-6 sm:mb-8 leading-relaxed">
              Топографиялық түсірістердің масштабы мен бедер биіктігін таңдау
            </h2>

            <div className="bg-white/10 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
              <label className="block text-white font-semibold mb-2 sm:mb-3 text-base sm:text-lg text-left">
                👤 Аты-жөніңізді жазыңыз:
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => {
                  setStudentName(e.target.value);
                  if (nameError) setNameError('');
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') startQuiz(); }}
                placeholder="Мысалы: Ахметов Алмас"
                className={`w-full p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/10 border-2 text-white placeholder-white/40 text-base sm:text-lg focus:outline-none transition-all duration-300 ${
                  nameError ? 'border-red-400 focus:border-red-400' : 'border-white/20 focus:border-blue-400'
                }`}
              />
              {nameError && (
                <p className="text-red-300 text-xs sm:text-sm mt-2 text-left flex items-center gap-1">
                  <span>⚠️</span> {nameError}
                </p>
              )}
            </div>

            <div className="bg-white/10 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 text-left">
              <h3 className="text-white font-semibold mb-2 sm:mb-3 text-base sm:text-lg">Тест туралы:</h3>
              <ul className="text-blue-100 space-y-1.5 sm:space-y-2 text-sm sm:text-base">
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 20 сұрақ</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 4 нұсқа (A, B, C, D)</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Әр сұраққа түсіндірме беріледі</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Нәтиже бағалау жүйесімен</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Word форматында жүктеуге болады</li>
              </ul>
              <div className="mt-3 sm:mt-4 bg-red-500/10 border border-red-400/30 rounded-lg p-2.5 sm:p-3">
                <p className="text-red-200 text-xs sm:text-sm font-medium">
                  ⚠️ НАЗАР АУДАРЫҢЫЗ: Тестті тек <strong>1 рет</strong> тапсыруға болады!
                </p>
              </div>
            </div>
            <button
              onClick={startQuiz}
              className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3.5 sm:py-4 px-8 sm:px-12 rounded-full text-lg sm:text-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Тестті бастау 🚀
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz state
  const question: Question = quizData[currentQuestion];
  const isAnswered = selectedAnswers[currentQuestion] !== null;
  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-2 sm:p-4">
      <div className="max-w-3xl w-full">
        <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2 flex-wrap">
          <div className="text-white/80 text-xs sm:text-sm font-medium truncate max-w-[30%]">
            👤 {savedName}
          </div>
          <div className="text-white/80 text-xs sm:text-sm font-medium">
            {currentQuestion + 1}/{quizData.length}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-yellow-300 text-xs sm:text-sm font-medium">⚠️ 1 рет</span>
            <div className="text-white/80 text-xs sm:text-sm font-medium">✓{score}</div>
          </div>
        </div>

        <div className="w-full h-2.5 sm:h-3 bg-white/10 rounded-full mb-4 sm:mb-6 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-3 sm:p-6 md:p-8 shadow-2xl border border-white/20">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs sm:text-sm font-bold px-3 sm:px-4 py-1 sm:py-1.5 rounded-full">
              #{currentQuestion + 1}
            </span>
            {isAnswered && (
              <span className={`text-xs sm:text-sm font-medium px-2 sm:px-3 py-0.5 sm:py-1 rounded-full ${
                selectedAnswers[currentQuestion] === question.correctAnswer
                  ? 'bg-green-500/20 text-green-300'
                  : 'bg-red-500/20 text-red-300'
              }`}>
                {selectedAnswers[currentQuestion] === question.correctAnswer ? '✓ Дұрыс' : '✗ Қате'}
              </span>
            )}
          </div>

          <h2 className="text-base sm:text-xl md:text-2xl font-semibold text-white mb-4 sm:mb-6 md:mb-8 leading-relaxed">
            {question.question}
          </h2>

          <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
            {question.options.map((option: string, idx: number) => {
              let optionStyle = 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/40 text-white';
              if (isAnswered) {
                if (idx === question.correctAnswer) {
                  optionStyle = 'bg-green-500/20 border-green-400 text-green-100';
                } else if (idx === selectedAnswers[currentQuestion] && idx !== question.correctAnswer) {
                  optionStyle = 'bg-red-500/20 border-red-400 text-red-100';
                } else {
                  optionStyle = 'bg-white/5 border-white/10 text-white/50';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswerSelect(idx)}
                  disabled={isAnswered}
                  className={`w-full text-left p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all duration-300 ${optionStyle} ${
                    !isAnswered ? 'cursor-pointer transform hover:scale-[1.01] active:scale-[0.98]' : 'cursor-default'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0 ${
                      isAnswered && idx === question.correctAnswer
                        ? 'bg-green-500 text-white'
                        : isAnswered && idx === selectedAnswers[currentQuestion]
                        ? 'bg-red-500 text-white'
                        : 'bg-white/20 text-white'
                    }`}>
                      {isAnswered && idx === question.correctAnswer ? '✓' : 
                       isAnswered && idx === selectedAnswers[currentQuestion] ? '✗' :
                       optionLabels[idx]}
                    </span>
                    <span className="text-sm sm:text-base md:text-lg">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {showExplanation && (
            <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg sm:rounded-xl p-3 sm:p-5 mb-4 sm:mb-6 animate-fadeIn">
              <div className="flex items-start gap-2 sm:gap-3">
                <span className="text-xl sm:text-2xl flex-shrink-0">💡</span>
                <div>
                  <h4 className="text-blue-200 font-semibold mb-1 text-xs sm:text-sm">Түсіндірме:</h4>
                  <p className="text-blue-100 leading-relaxed text-xs sm:text-sm md:text-base">{question.explanation}</p>
                </div>
              </div>
            </div>
          )}

          {isAnswered && currentQuestion < quizData.length - 1 && (
            <div className="text-center text-white/50 text-xs sm:text-sm">
              Келесі сұрақ автоматты түрде ашылады...
            </div>
          )}
        </div>

        <div className="mt-4 sm:mt-6 flex flex-wrap gap-1 sm:gap-2 justify-center">
          {quizData.map((q: Question, idx: number) => (
            <div
              key={q.id}
              className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all duration-300 ${
                idx === currentQuestion
                  ? 'bg-white text-indigo-900 scale-110'
                  : selectedAnswers[idx] !== null
                  ? selectedAnswers[idx] === q.correctAnswer
                    ? 'bg-green-500/80 text-white'
                    : 'bg-red-500/80 text-white'
                  : 'bg-white/10 text-white/60'
              }`}
            >
              {idx + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
