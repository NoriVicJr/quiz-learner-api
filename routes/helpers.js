const Question = require('../models/Question')

module.exports = {
  getScore: (questionsId, answers, _callback) => {
    let allQuestions = questionsId.length
    let wrongAnswers = []
    let correctAnswers = []
    for (let i = 0; i < allQuestions; i++) {
      Question.findById(questionsId[i]).then(question => {
        let isCorrect = true
        for (let j = 0; j < question.correctAnswers.length; j++) {
          if (!question.correctAnswers[j] || !answers[i][j]) {
            isCorrect = false
            break
          }
          if (question.correctAnswers[j] !== answers[i][j]) {
            isCorrect = false
            break
          }
        }

        let answer = {
          question: question.question,
          answer: answers[i]
        }

        if (isCorrect) {
          correctAnswers.push(answer)
        } else {
          answer.correctAnswer = question.correctAnswers
          wrongAnswers.push(answer)
        }

        // Last question traversed
        if (i === allQuestions - 1) {
          let result = {
            correctCount: correctAnswers.length,
            wrongCount: wrongAnswers.length,
            wrongAnswers: wrongAnswers,
            correctAnswers: correctAnswers,
            score: ((correctAnswers.length / allQuestions) * 10).toFixed(2) // From 0 to 10
          }

          console.log(result)
          _callback(result)
        }
      }).catch(err => {
        console.log(err)
      })
    }
    return {}
  }
}
