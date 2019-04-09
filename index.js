const DOM = {
  quizForm: document.forms['quiz-form'],
  loader: document.querySelector('.load-wrapper'),
  quizContent: document.querySelector('.quiz-content'),
  quizQuestionUl: document.querySelector('.questions'),
  timerWrapper: document.querySelector('.time-wrapper'),
  timer: document.querySelector('#timer'),

  renderScore: (score, fullScore) => {
    let message = '';
    const ratio = score / fullScore;

    if (ratio >= 0.9) {
      message = 'YOU ARE SO SMORT! 🧠';
    } else if (ratio < 0.9 && ratio >= 0.6) {
      message = "EH you're mediocre at best... get your head in the game!";
    } else {
      message = "pull it together you're embarassing yourself!";
    }

    DOM.quizQuestionUl.innerHTML = `
        <li class="result">
          <p>you get ${score} of ${fullScore}.</p>
          <p>${message}</p>
        </li>
        <br>
        <br>
        <h3><a href='./index.html'>GIVE IT ANOTHER GO???</a></h3>
      `;
  },

  renderSingleQuiz: (question) => {
    const options = DOM.renderOptions(
      QUIZ.randomizeOptions(question.correct_answer, question.incorrect_answers)
    );
    DOM.quizQuestionUl.innerHTML = `
        <li>
          <p>${question.question}</p>
          <select>
            ${options}
          </select>
          <div class="button-row">
            <button type="button" class="button skip-button">Skip</button>
            <button type="button" class="button answer-button">Confirm</button>
          </div>
        </li>
      `;
  },

  renderOptions: (options) => {
    return options.map((option) => `<option>${option}</option>`);
  },

  renderAnswer: (userAnswer, question) => {
    let message;
    if (userAnswer === '') {
      userAnswer = "OOPS you didn't answer";
    }

    if (userAnswer === question.correct_answer) {
      message = 'GREAT JOB! GIT ER DONE!';
    } else {
      message = 'I BELIEVE IN U.. GIVE IT 1 MORE TRYYY';
    }

    DOM.quizQuestionUl.innerHTML = `
        <li>
          <p>Your answer is ${userAnswer}!</p>
          <p>The correct answer is ${question.correct_answer}.</p>
          <br>
          <p>${message}</p>
          <button type="button" class="button next-button">Next Question</button>
        </li>
      `;
  },

  renderTimer: (time) => {
    DOM.timerWrapper.style.display = 'block';
    DOM.timer.innerHTML = time;
  }
};

const API = {
  quizUrl: '',

  getQuizCategoryId: (category) => {
    switch (category) {
      case 'animals':
        return 27;
      case 'boardgame':
        return 16;
      case 'computer':
        return 18;
      default:
        return 17;
    }
  }
};

const QUIZ = {
  initialTimer: 5,
  currentTimer: 5,
  timerId: null,
  score: 100,
  scorePerQuestion: 0,
  correctAnswerIdx: 0,
  questions: [],

  randomizeOptions: (correctAnswer, incorrectAnswers) => {
    const answers = [correctAnswer, ...incorrectAnswers];
    answers.sort(() => Math.random() - 0.5);
    return answers;
  },

  setTimerOnDifficulty(difficulty) {
    if (difficulty === 'easy') {
      QUIZ.initialTimer = 5;
      QUIZ.currentTimer = 5;
    } else if (difficulty === 'medium') {
      QUIZ.initialTimer = 10;
      QUIZ.currentTimer = 10;
    } else {
      QUIZ.initialTimer = 15;
      QUIZ.currentTimer = 15;
    }
  },
  initiateQuiz() {
    const difficulty = DOM.quizForm.elements[0].value;
    const category = DOM.quizForm.elements[1].value;
    const categoryId = API.getQuizCategoryId(category);
    const quantity = DOM.quizForm.elements[2].value;

    API.quizUrl = `https://opentdb.com/api.php?amount=${quantity}&category=${categoryId}&difficulty=${difficulty}&type=multiple`;

    QUIZ.setTimerOnDifficulty(difficulty);
    DOM.quizForm.style.display = 'none';
    DOM.loader.style.display = 'block';
  },

  skipQuestion() {
    QUIZ.stopTimer();
    QUIZ.score -= scorePerQuestion;
    const userAnswer = '';
    DOM.renderAnswer(
      userAnswer,
      QUIZ.questions[QUIZ.correctAnswerIdx],
      DOM.quizQuestionUl
    );
    QUIZ.correctAnswerIdx++;
  },

  answerQuestion(userAnswer) {
    QUIZ.stopTimer();
    if (userAnswer !== QUIZ.questions[QUIZ.correctAnswerIdx].correct_answer) {
      QUIZ.score -= scorePerQuestion;
    } else {
      QUIZ.score -= QUIZ.calculateLoss();
    }

    DOM.renderAnswer(userAnswer, QUIZ.questions[QUIZ.correctAnswerIdx]);
    QUIZ.correctAnswerIdx++;
  },

  startNextQuestion: () => {
    if (QUIZ.correctAnswerIdx > QUIZ.questions.length - 1) {
      return DOM.renderScore(QUIZ.score, 100, DOM.quizQuestionUl);
    }
    DOM.renderSingleQuiz(
      QUIZ.questions[QUIZ.correctAnswerIdx],
      DOM.quizQuestionUl
    );
    QUIZ.startTimer();
  },

  startTimer: () => {
    QUIZ.currentTimer = QUIZ.initialTimer;
    DOM.renderTimer(QUIZ.initialTimer);
    QUIZ.timerId = setInterval(() => {
      QUIZ.currentTimer--;
      DOM.renderTimer(QUIZ.currentTimer);
      if (QUIZ.currentTimer === 0) {
        console.log('clear timer');
        QUIZ.skipQuestion();
      }
    }, 1000);
  },

  stopTimer: () => {
    clearInterval(QUIZ.timerId);
  },

  calculateLoss: () => {
    const usedTime = QUIZ.initialTimer - QUIZ.currentTimer;
    return Math.round(((usedTime / QUIZ.initialTimer) * scorePerQuestion) / 2);
  }
};

// event listeners //

document.querySelector('.quiz-form').addEventListener('submit', (event) => {
  event.preventDefault();

  QUIZ.initiateQuiz();
  console.log(API.quizUrl);
  fetch(API.quizUrl)
    .then((response) => response.json())
    .then((data) => {
      if (data) {
        DOM.quizContent.style.display = 'block';
        DOM.loader.style.display = 'none';
      }

      QUIZ.questions = data.results;

      scorePerQuestion = Math.round(QUIZ.score / QUIZ.questions.length);

      // render 1 quiz at a time
      DOM.renderSingleQuiz(QUIZ.questions[QUIZ.correctAnswerIdx]);

      QUIZ.startTimer();
    })
    .catch((err) => console.log(err));
});

// use event delegation to listen to event on dynamic elements
document.addEventListener('click', (event) => {
  if (event.target && event.target.className === 'button skip-button') {
    QUIZ.skipQuestion();
  }

  if (event.target && event.target.className === 'button next-button') {
    QUIZ.startNextQuestion();
  }

  if (event.target && event.target.className === 'button answer-button') {
    const userAnswer = event.target.parentNode.previousElementSibling.value;

    QUIZ.answerQuestion(userAnswer);
  }
});
